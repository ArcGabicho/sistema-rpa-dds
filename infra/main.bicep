// Deploys the Data Discovery Solutions stack to Azure:
// - Container Registry (holds the client/server images)
// - Azure SQL Server + Database, with a dedicated least-privilege app login
//   (never the server admin) created by a deployment script
// - Key Vault (RBAC-enabled) holding the connection string, JWT secret and
//   admin password, referenced by the container apps via managed identity
// - Container Apps Environment running the client and server images
//
// Deploy via scripts/deploy.sh, which builds/pushes the images and supplies
// the secure parameters from environment variables. This template is
// idempotent: re-running it updates resources in place.

@description('Short name used to derive resource names (lowercase letters/numbers).')
@minLength(2)
@maxLength(10)
param environmentName string = 'dds'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('SQL Server admin login. Only used to provision the app-specific login; the app never connects with this account.')
param sqlAdminLogin string = 'ddsadmin'

@secure()
@description('SQL Server admin password.')
param sqlAdminPassword string

@description('Login the application actually connects with (least privilege, scoped to its own database).')
param appDbLogin string = 'dds_app'

@secure()
@description('Password for the application database login.')
param appDbPassword string

@description('Name of the application database.')
param sqlDatabaseName string = 'DdsDb'

@secure()
@description('Symmetric key used to sign/verify session JWTs. Shared by client and server.')
param jwtSecret string

@description('Email of the seeded administrator account.')
param adminEmail string

@secure()
@description('Password of the seeded administrator account.')
param adminPassword string

@description('Display name of the seeded administrator account.')
param adminFullName string = 'Administrador'

@description('Tag of the client image in the container registry.')
param clientImageTag string = 'latest'

@description('Tag of the server image in the container registry.')
param serverImageTag string = 'latest'

var uniqueSuffix = substring(uniqueString(resourceGroup().id), 0, 8)
var acrName = toLower('acr${environmentName}${uniqueSuffix}')
var keyVaultName = toLower('kv-${environmentName}-${uniqueSuffix}')
var sqlServerName = toLower('sql-${environmentName}-${uniqueSuffix}')
var logAnalyticsName = 'log-${environmentName}-${uniqueSuffix}'
var containerAppsEnvName = 'cae-${environmentName}'
var identityName = 'id-${environmentName}'
var clientAppName = '${environmentName}-client'
var serverAppName = '${environmentName}-server'

var acrPullRoleId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '7f951dda-4ed3-4680-a7ca-43fe172d538d'
)
var keyVaultSecretsUserRoleId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '4633458b-17de-408a-b874-0445c86b69e6'
)

// ---------------------------------------------------------------------------
// Identity used by both container apps to pull from ACR and read Key Vault.
// ---------------------------------------------------------------------------
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
}

// ---------------------------------------------------------------------------
// Container Registry
// ---------------------------------------------------------------------------
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, identity.id, 'AcrPull')
  scope: acr
  properties: {
    roleDefinitionId: acrPullRoleId
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ---------------------------------------------------------------------------
// Key Vault (RBAC authorization, no legacy access policies)
// ---------------------------------------------------------------------------
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enabledForTemplateDeployment: true
  }
}

resource keyVaultSecretsUserAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, identity.id, 'KeyVaultSecretsUser')
  scope: keyVault
  properties: {
    roleDefinitionId: keyVaultSecretsUserRoleId
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ---------------------------------------------------------------------------
// Azure SQL: logical server + database. The server admin login is only used
// once, by the deployment script below, to create the app's own login.
// ---------------------------------------------------------------------------
resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

resource sqlFirewallAllowAzure 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: 'Basic'
    tier: 'Basic'
  }
  properties: {
    maxSizeBytes: 2147483648
  }
}

// Creates (idempotently) a contained database user for the app, scoped to
// just this database via db_owner — analogous to docker/database/init.sql,
// so the app never authenticates as the SQL admin.
resource dbAppUserSetup 'Microsoft.Resources/deploymentScripts@2023-08-01' = {
  name: 'dbAppUserSetup'
  location: location
  kind: 'AzureCLI'
  properties: {
    azCliVersion: '2.60.0'
    retentionInterval: 'PT1H'
    timeout: 'PT15M'
    cleanupPreference: 'OnSuccess'
    environmentVariables: [
      { name: 'SQL_SERVER_FQDN', value: sqlServer.properties.fullyQualifiedDomainName }
      { name: 'SQL_DB_NAME', value: sqlDatabaseName }
      { name: 'SQL_ADMIN_LOGIN', value: sqlAdminLogin }
      { name: 'SQL_ADMIN_PASSWORD', secureValue: sqlAdminPassword }
      { name: 'APP_DB_LOGIN', value: appDbLogin }
      { name: 'APP_DB_PASSWORD', secureValue: appDbPassword }
    ]
    scriptContent: '''
      set -e
      curl -sSL -O https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
      dpkg -i packages-microsoft-prod.deb
      rm -f packages-microsoft-prod.deb
      apt-get update
      ACCEPT_EULA=Y apt-get install -y mssql-tools18
      export PATH="$PATH:/opt/mssql-tools18/bin"

      sqlcmd -S "$SQL_SERVER_FQDN" -d "$SQL_DB_NAME" -U "$SQL_ADMIN_LOGIN" -P "$SQL_ADMIN_PASSWORD" -C -Q "
        IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = '$(APP_DB_LOGIN)')
        BEGIN
          CREATE USER [$(APP_DB_LOGIN)] WITH PASSWORD = '$(APP_DB_PASSWORD)';
          ALTER ROLE db_owner ADD MEMBER [$(APP_DB_LOGIN)];
        END
      " -v APP_DB_LOGIN="$APP_DB_LOGIN" APP_DB_PASSWORD="$APP_DB_PASSWORD"
    '''
  }
  dependsOn: [
    sqlDatabase
    sqlFirewallAllowAzure
  ]
}

// ---------------------------------------------------------------------------
// Key Vault secrets
// ---------------------------------------------------------------------------
resource sqlConnectionSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'sql-connection-string'
  properties: {
    value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Database=${sqlDatabaseName};User Id=${appDbLogin};Password=${appDbPassword};Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
  }
  dependsOn: [
    dbAppUserSetup
  ]
}

resource jwtSecretKv 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'jwt-secret'
  properties: {
    value: jwtSecret
  }
}

resource adminPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'admin-password'
  properties: {
    value: adminPassword
  }
}

// ---------------------------------------------------------------------------
// Container Apps Environment
// ---------------------------------------------------------------------------
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppsEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Server (ASP.NET Core API) — internal only, the client is the sole caller.
// ---------------------------------------------------------------------------
resource serverApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: serverAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    environmentId: containerAppsEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 8080
        transport: 'http'
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: identity.id
        }
      ]
      secrets: [
        { name: 'sql-connection-string', keyVaultUrl: sqlConnectionSecret.properties.secretUri, identity: identity.id }
        { name: 'jwt-secret', keyVaultUrl: jwtSecretKv.properties.secretUri, identity: identity.id }
        { name: 'admin-password', keyVaultUrl: adminPasswordSecret.properties.secretUri, identity: identity.id }
      ]
    }
    template: {
      containers: [
        {
          name: 'server'
          image: '${acr.properties.loginServer}/dds-server:${serverImageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
            { name: 'ConnectionStrings__Default', secretRef: 'sql-connection-string' }
            { name: 'Jwt__Secret', secretRef: 'jwt-secret' }
            { name: 'Jwt__ExpiresInMinutes', value: '60' }
            { name: 'Admin__Email', value: adminEmail }
            { name: 'Admin__Password', secretRef: 'admin-password' }
            { name: 'Admin__FullName', value: adminFullName }
            { name: 'Cors__AllowedOrigins__0', value: 'https://${clientAppName}.${containerAppsEnv.properties.defaultDomain}' }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 2
      }
    }
  }
  dependsOn: [
    acrPullAssignment
    keyVaultSecretsUserAssignment
    dbAppUserSetup
  ]
}

// ---------------------------------------------------------------------------
// Client (Next.js) — public ingress.
// ---------------------------------------------------------------------------
resource clientApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: clientAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    environmentId: containerAppsEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: identity.id
        }
      ]
      secrets: [
        { name: 'jwt-secret', keyVaultUrl: jwtSecretKv.properties.secretUri, identity: identity.id }
      ]
    }
    template: {
      containers: [
        {
          name: 'client'
          image: '${acr.properties.loginServer}/dds-client:${clientImageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'API_URL', value: 'https://${serverApp.properties.configuration.ingress.fqdn}' }
            { name: 'JWT_SECRET', secretRef: 'jwt-secret' }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
  dependsOn: [
    acrPullAssignment
    keyVaultSecretsUserAssignment
  ]
}

output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output clientAppName string = clientApp.name
output serverAppName string = serverApp.name
output clientUrl string = 'https://${clientApp.properties.configuration.ingress.fqdn}'
output serverInternalUrl string = 'https://${serverApp.properties.configuration.ingress.fqdn}'
output keyVaultName string = keyVault.name
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output resourceGroupName string = resourceGroup().name
