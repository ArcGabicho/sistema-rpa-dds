// Plantilla: IA Document Processor.
// Provisiona un Container App que procesa documentos usando un modelo de IA
// (vía la API key del usuario) y un contenedor de Blob Storage donde se leen
// y escriben los documentos. La imagen del contenedor se despliega por
// separado (CI/CD); este template solo crea la infraestructura, con una
// imagen de arranque de referencia.
targetScope = 'resourceGroup'

@description('Nombre lógico del servicio, usado como prefijo de los recursos.')
param serviceName string

@description('Nombre del contenedor de Blob Storage donde se leen/escriben los documentos.')
param storageContainer string = 'documents'

@description('Modelo de IA a usar (p.ej. gpt-4o-mini).')
param model string = 'gpt-4o-mini'

@description('API key del proveedor de IA (OpenAI o Azure OpenAI) que el usuario trae consigo.')
@secure()
param openaiKey string

@description('Nombre del Container Apps Environment existente donde se despliega el servicio.')
param containerAppsEnvironmentName string

@description('Id de la implementación en la base de datos de la plataforma, usado solo para etiquetar recursos.')
param implementacionId string

param location string = resourceGroup().location

var namePrefix = toLower(replace(serviceName, '-', ''))
var uniqueSuffix = substring(uniqueString(resourceGroup().id, serviceName), 0, 8)
var storageAccountName = take('st${namePrefix}${uniqueSuffix}', 24)
var containerAppName = 'ca-${serviceName}-${uniqueSuffix}'

var commonTags = {
  'dds-implementacion-id': implementacionId
  'dds-template-id': 'ai-document-processor'
}

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: containerAppsEnvironmentName
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  tags: commonTags
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
}

resource documentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: storageContainer
  properties: {
    publicAccess: 'None'
  }
}

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  tags: union(commonTags, { 'dds-role': 'compute' })
  properties: {
    environmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
      }
      secrets: [
        { name: 'openai-key', value: openaiKey }
        { name: 'storage-connection-string', value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net' }
      ]
    }
    template: {
      containers: [
        {
          name: 'app'
          image: 'mcr.microsoft.com/k8se/quickstart:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'OPENAI_API_KEY', secretRef: 'openai-key' }
            { name: 'MODEL', value: model }
            { name: 'STORAGE_CONTAINER', value: storageContainer }
            { name: 'STORAGE_CONNECTION_STRING', secretRef: 'storage-connection-string' }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}

output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output containerAppName string = containerApp.name
output storageAccountName string = storageAccount.name
