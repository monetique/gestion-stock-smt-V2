/**
 * Tests automatisés des APIs
 * Exécuter avec: npx tsx tests/api-tests.ts
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
// Utiliser les utilisateurs du seed : admin@monetique.tn / password123 ou user@monetique.tn / password123
// Ou définir TEST_EMAIL et TEST_PASSWORD dans les variables d'environnement
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@monetique.tn'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  details?: any
}

const results: TestResult[] = []

// Helper pour logger les résultats
function logResult(result: TestResult) {
  results.push(result)
  const icon = result.passed ? '✅' : '❌'
  console.log(`${icon} ${result.name}`)
  if (!result.passed && result.error) {
    console.log(`   Erreur: ${result.error}`)
  }
  if (result.details) {
    console.log(`   Détails:`, result.details)
  }
}

// Helper pour les appels API
async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    const data = await response.json()
    return { response, data }
  } catch (error) {
    return { 
      response: null, 
      data: null, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

// Tests d'authentification
async function testAuth() {
  console.log('\n🔐 Tests d\'authentification')
  
  // Test 1: Login avec mauvais identifiants
  const { data: loginFail } = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'wrong@test.com', password: 'wrong' }),
  })
  logResult({
    name: 'Login avec mauvais identifiants (doit échouer)',
    passed: !loginFail?.success,
  })

  // Test 2: Login (si utilisateur existe)
  const { data: loginData, response: loginResponse } = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  })
  
  const userToken = loginData?.success ? loginData.data : null
  
  logResult({
    name: 'Login avec identifiants valides',
    passed: loginData?.success === true,
    details: loginData?.success ? `User ID: ${userToken?.id}` : loginData?.error,
  })

  return userToken
}

// Tests des banques
async function testBanks(userToken: any) {
  console.log('\n🏦 Tests des banques')
  
  const headers: HeadersInit = userToken ? {
    'x-user-data': JSON.stringify({
      id: userToken.id,
      email: userToken.email,
      firstName: userToken.firstName || 'Test',
      lastName: userToken.lastName || 'User',
    }),
  } : {}

  // Test 1: Lister les banques
  const { data: banksList } = await apiCall('/api/banks', {
    headers,
  })
  logResult({
    name: 'GET /api/banks - Lister les banques',
    passed: banksList?.success === true && Array.isArray(banksList.data),
    details: `Nombre de banques: ${banksList?.data?.length || 0}`,
  })

  // Test 2: Créer une banque de test
  const testBank = {
    name: `Banque Test ${Date.now()}`,
    code: `TEST${Date.now()}`,
    address: '123 Test Street',
    phone: '123456789',
    email: 'test@bank.com',
    country: 'Tunisie',
    swiftCode: 'TESTTNXX',
  }

  const { data: createBank } = await apiCall('/api/banks', {
    method: 'POST',
    headers,
    body: JSON.stringify(testBank),
  })

  const createdBankId = createBank?.success ? createBank.data?.id : null

  logResult({
    name: 'POST /api/banks - Créer une banque',
    passed: createBank?.success === true && createdBankId,
    details: createdBankId ? `ID: ${createdBankId}` : createBank?.error,
  })

  if (!createdBankId) {
    return null
  }

  // Test 3: Récupérer une banque spécifique
  if (createdBankId) {
    // Ajouter un petit délai pour s'assurer que la banque est bien créée
    await new Promise(resolve => setTimeout(resolve, 200))
    const { data: getBank, response: getBankResponse } = await apiCall(`/api/banks/${createdBankId}`, {
      headers,
    })
    const isSuccess = getBankResponse?.status === 200 && getBank?.success === true && getBank.data?.id === createdBankId
    logResult({
      name: `GET /api/banks/{id} - Récupérer une banque`,
      passed: isSuccess,
      details: isSuccess ? `Banque récupérée: ${getBank.data?.name}` : `Status: ${getBankResponse?.status}, Error: ${getBank?.error || 'Erreur inconnue'}`,
    })
  } else {
    logResult({
      name: `GET /api/banks/{id} - Récupérer une banque`,
      passed: false,
      error: 'Impossible de tester - aucune banque créée',
    })
  }

  // Test 4: Mettre à jour une banque
  const { data: updateBank } = await apiCall(`/api/banks/${createdBankId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ ...testBank, name: `${testBank.name} (modifié)` }),
  })
  logResult({
    name: 'PUT /api/banks/{id} - Mettre à jour une banque',
    passed: updateBank?.success === true,
  })

  // Test 5: Supprimer la banque de test
  const { data: deleteBank } = await apiCall(`/api/banks/${createdBankId}`, {
    method: 'DELETE',
    headers,
  })
  logResult({
    name: 'DELETE /api/banks/{id} - Supprimer une banque',
    passed: deleteBank?.success === true,
  })

  return createdBankId
}

// Tests des cartes
async function testCards(userToken: any) {
  console.log('\n💳 Tests des cartes')
  
  const headers: HeadersInit = userToken ? {
    'x-user-data': JSON.stringify({
      id: userToken.id,
      email: userToken.email,
      firstName: userToken.firstName || 'Test',
      lastName: userToken.lastName || 'User',
    }),
  } : {}

  // Test 1: Lister les cartes
  const { data: cardsList } = await apiCall('/api/cards', {
    headers,
  })
  logResult({
    name: 'GET /api/cards - Lister les cartes',
    passed: cardsList?.success === true && Array.isArray(cardsList.data),
    details: `Nombre de cartes: ${cardsList?.data?.length || 0}`,
  })

  // Pour créer une carte, il faut d'abord une banque
  // On récupère la première banque disponible
  const { data: banksData } = await apiCall('/api/banks', { headers })
  const firstBank = banksData?.data?.[0]

  if (!firstBank) {
    logResult({
      name: 'Création de carte - Aucune banque disponible',
      passed: false,
      error: 'Aucune banque disponible pour créer une carte de test',
    })
    return null
  }

  // Test 2: Créer une carte de test
  const testCard = {
    name: `Carte Test ${Date.now()}`,
    type: 'Carte débit',
    subType: 'Mastercard',
    subSubType: 'National',
    bankId: firstBank.id,
    quantity: 100,
    minThreshold: 50,
    maxThreshold: 500,
  }

  const { data: createCard } = await apiCall('/api/cards', {
    method: 'POST',
    headers,
    body: JSON.stringify(testCard),
  })

  const createdCardId = createCard?.success ? createCard.data?.id : null

  logResult({
    name: 'POST /api/cards - Créer une carte',
    passed: createCard?.success === true && createdCardId,
    details: createdCardId ? `ID: ${createdCardId}` : createCard?.error,
  })

  if (!createdCardId) {
    return null
  }

  // Test 3: Récupérer une carte spécifique
  const { data: getCard } = await apiCall(`/api/cards/${createdCardId}`, {
    headers,
  })
  logResult({
    name: `GET /api/cards/{id} - Récupérer une carte`,
    passed: getCard?.success === true && getCard.data?.id === createdCardId,
  })

  return createdCardId
}

// Tests des emplacements
async function testLocations(userToken: any) {
  console.log('\n📍 Tests des emplacements')
  
  const headers: HeadersInit = userToken ? {
    'x-user-data': JSON.stringify({
      id: userToken.id,
      email: userToken.email,
      firstName: userToken.firstName || 'Test',
      lastName: userToken.lastName || 'User',
    }),
  } : {}

  // Test 1: Lister les emplacements
  const { data: locationsList } = await apiCall('/api/locations', {
    headers,
  })
  logResult({
    name: 'GET /api/locations - Lister les emplacements',
    passed: locationsList?.success === true && Array.isArray(locationsList.data),
    details: `Nombre d'emplacements: ${locationsList?.data?.length || 0}`,
  })

  // Pour créer un emplacement, il faut une banque
  const { data: banksData } = await apiCall('/api/banks', { headers })
  const firstBank = banksData?.data?.[0]

  if (!firstBank) {
    logResult({
      name: 'Création d\'emplacement - Aucune banque disponible',
      passed: false,
      error: 'Aucune banque disponible pour créer un emplacement de test',
    })
    return null
  }

  // Test 2: Créer un emplacement de test
  const testLocation = {
    name: `Emplacement Test ${Date.now()}`,
    description: 'Description test',
    bankId: firstBank.id,
  }

  const { data: createLocation } = await apiCall('/api/locations', {
    method: 'POST',
    headers,
    body: JSON.stringify(testLocation),
  })

  const createdLocationId = createLocation?.success ? createLocation.data?.id : null

  logResult({
    name: 'POST /api/locations - Créer un emplacement',
    passed: createLocation?.success === true && createdLocationId,
    details: createdLocationId ? `ID: ${createdLocationId}` : createLocation?.error,
  })

  return createdLocationId
}

// Tests des mouvements
async function testMovements(userToken: any) {
  console.log('\n📦 Tests des mouvements')
  
  const headers: HeadersInit = userToken ? {
    'x-user-data': JSON.stringify({
      id: userToken.id,
      email: userToken.email,
      firstName: userToken.firstName || 'Test',
      lastName: userToken.lastName || 'User',
    }),
  } : {}

  // Test 1: Lister les mouvements
  const { data: movementsList } = await apiCall('/api/movements?page=1&limit=10', {
    headers,
  })
  // La réponse contient { movements: [], total: 0, page: 1, limit: 10, totalPages: 0 }
  const hasCorrectStructure = movementsList?.success === true && 
                              (movementsList.data?.movements ? Array.isArray(movementsList.data.movements) : Array.isArray(movementsList.data))
  logResult({
    name: 'GET /api/movements - Lister les mouvements',
    passed: hasCorrectStructure,
    details: `Nombre de mouvements: ${movementsList?.data?.total || movementsList?.total || 0}`,
    error: movementsList?.success ? undefined : movementsList?.error,
  })

  // Pour créer un mouvement, il faut une carte et éventuellement un emplacement
  const { data: cardsData } = await apiCall('/api/cards', { headers })
  const firstCard = cardsData?.data?.[0]

  if (!firstCard) {
    logResult({
      name: 'Création de mouvement - Aucune carte disponible',
      passed: false,
      error: 'Aucune carte disponible pour créer un mouvement de test',
    })
    return null
  }

  // Test 2: Créer un mouvement d'entrée
  const { data: locationsData } = await apiCall('/api/locations', { headers })
  const firstLocation = locationsData?.data?.[0]

  // Pour une entrée, on utilise toLocationId (destination)
  const testMovement = {
    cardId: firstCard.id,
    movementType: 'entry',
    quantity: 10,
    reason: 'Test d\'entrée de stock',
    userId: userToken?.id,
    toLocationId: firstLocation?.id || null,
  }

  const { data: createMovement } = await apiCall('/api/movements', {
    method: 'POST',
    headers,
    body: JSON.stringify(testMovement),
  })

  const createdMovementId = createMovement?.success ? createMovement.data?.id : null

  logResult({
    name: 'POST /api/movements - Créer un mouvement',
    passed: createMovement?.success === true && createdMovementId,
    details: createdMovementId ? `ID: ${createdMovementId}` : createMovement?.error,
  })

  return createdMovementId
}

// Tests des utilisateurs
async function testUsers(userToken: any) {
  console.log('\n👥 Tests des utilisateurs')
  
  const headers: HeadersInit = userToken ? {
    'x-user-data': JSON.stringify({
      id: userToken.id,
      email: userToken.email,
      firstName: userToken.firstName || 'Test',
      lastName: userToken.lastName || 'User',
    }),
  } : {}

  // Test 1: Lister les utilisateurs
  const { data: usersList } = await apiCall('/api/users', {
    headers,
  })
  logResult({
    name: 'GET /api/users - Lister les utilisateurs',
    passed: usersList?.success === true && Array.isArray(usersList.data),
    details: `Nombre d'utilisateurs: ${usersList?.data?.length || 0}`,
  })
}

// Tests des statistiques
async function testStats(userToken: any) {
  console.log('\n📊 Tests des statistiques')
  
  const headers: HeadersInit = userToken ? {
    'x-user-data': JSON.stringify({
      id: userToken.id,
      email: userToken.email,
      firstName: userToken.firstName || 'Test',
      lastName: userToken.lastName || 'User',
    }),
  } : {}

  const { data: stats } = await apiCall('/api/stats', {
    headers,
  })

  logResult({
    name: 'GET /api/stats - Récupérer les statistiques',
    passed: stats?.success === true && typeof stats.data === 'object',
    details: stats?.data ? `Stats disponibles: ${Object.keys(stats.data).length} catégories` : stats?.error,
  })
}

// Tests de configuration
async function testConfig(userToken: any) {
  console.log('\n⚙️ Tests de configuration')
  
  const headers: HeadersInit = userToken ? {
    'x-user-data': JSON.stringify({
      id: userToken.id,
      email: userToken.email,
      firstName: userToken.firstName || 'Test',
      lastName: userToken.lastName || 'User',
    }),
  } : {}

  // Test 1: Récupérer la configuration
  const { data: config } = await apiCall('/api/config', {
    headers,
  })

  logResult({
    name: 'GET /api/config - Récupérer la configuration',
    passed: config?.success === true && typeof config.data === 'object',
  })
}

// Tests des logs d'audit
async function testLogs(userToken: any) {
  console.log('\n📋 Tests des logs d\'audit')
  
  const headers: HeadersInit = userToken ? {
    'x-user-data': JSON.stringify({
      id: userToken.id,
      email: userToken.email,
      firstName: userToken.firstName || 'Test',
      lastName: userToken.lastName || 'User',
    }),
  } : {}

  const { data: logs } = await apiCall('/api/logs?limit=10', {
    headers,
  })

  logResult({
    name: 'GET /api/logs - Récupérer les logs',
    passed: logs?.success === true && Array.isArray(logs.data),
    details: `Nombre de logs: ${logs?.total || 0}`,
  })
}

// Fonction principale
async function runAllTests() {
  console.log('🧪 Démarrage des tests automatisés de l\'application')
  console.log(`📍 URL de base: ${API_BASE_URL}`)
  console.log('=' .repeat(60))

  try {
    // Tests d'authentification
    const userToken = await testAuth()

    if (!userToken) {
      console.log('\n⚠️  Impossible de continuer sans utilisateur authentifié')
      console.log('   Veuillez créer un utilisateur de test ou utiliser des identifiants valides')
      return
    }

    // Tests des fonctionnalités principales
    await testBanks(userToken)
    await testCards(userToken)
    await testLocations(userToken)
    await testMovements(userToken)
    await testUsers(userToken)
    await testStats(userToken)
    await testConfig(userToken)
    await testLogs(userToken)

    // Résumé
    console.log('\n' + '='.repeat(60))
    console.log('📊 RÉSUMÉ DES TESTS')
    console.log('='.repeat(60))
    
    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length
    const total = results.length

    console.log(`Total: ${total} tests`)
    console.log(`✅ Réussis: ${passed}`)
    console.log(`❌ Échoués: ${failed}`)
    console.log(`📈 Taux de réussite: ${((passed / total) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n❌ Tests échoués:')
      results.filter(r => !r.passed).forEach(r => {
        console.log(`   - ${r.name}`)
        if (r.error) console.log(`     ${r.error}`)
      })
    }

    process.exit(failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n💥 Erreur fatale lors des tests:', error)
    process.exit(1)
  }
}

// Exécuter les tests
runAllTests()

