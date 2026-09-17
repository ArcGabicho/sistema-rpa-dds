// Plantilla: RPA Web Scraping.
// Provisiona una Function App (Python, plan de consumo) con un timer trigger
// que ejecuta el scraper contra targetUrl según scheduleCron. El código de la
// función se despliega por separado (CI/CD); este template solo crea la
// infraestructura.
targetScope = 'resourceGroup'

@description('Nombre lógico del servicio, usado como prefijo de los recursos.')
param serviceName string

@description('URL objetivo del scraping.')
param targetUrl string

@description('Expresión CRON (NCronTab) para el timer trigger.')
param scheduleCron string = '0 0 * * * *'

@description('Credencial del driver de navegador (p.ej. API key de un servicio de scraping headless).')
@secure()
param browserDriverKey string

@description('Id de la implementación en la base de datos de la plataforma, usado solo para etiquetar recursos.')
param implementacionId string

param location string = resourceGroup().location

var namePrefix = toLower(replace(serviceName, '-', ''))
var uniqueSuffix = substring(uniqueString(resourceGroup().id, serviceName), 0, 8)
var storageAccountName = take('st${namePrefix}${uniqueSuffix}', 24)
var hostingPlanName = 'plan-${serviceName}-${uniqueSuffix}'
var functionAppName = 'func-${serviceName}-${uniqueSuffix}'
var appInsightsName = 'appi-${serviceName}-${uniqueSuffix}'

var commonTags = {
  'dds-implementacion-id': implementacionId
  'dds-template-id': 'rpa-web-scraping'
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

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  tags: union(commonTags, { 'dds-role': 'monitoring' })
  properties: {
    Application_Type: 'web'
  }
}

resource hostingPlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: hostingPlanName
  location: location
  tags: commonTags
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'functionapp'
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  tags: union(commonTags, { 'dds-role': 'compute' })
  properties: {
    serverFarmId: hostingPlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.11'
      appSettings: [
        { name: 'AzureWebJobsStorage', value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net' }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'python' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'TARGET_URL', value: targetUrl }
        { name: 'SCHEDULE_CRON', value: scheduleCron }
        { name: 'BROWSER_DRIVER_KEY', value: browserDriverKey }
      ]
    }
  }
}

output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output functionAppName string = functionApp.name
output storageAccountName string = storageAccount.name
