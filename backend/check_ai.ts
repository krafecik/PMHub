const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAi() {
  let attempts = 0;
  const maxAttempts = 10;
  let token = '';
  let tenantId = '1'; // Default fallback

  // 1. Autenticar
  console.log('Tentando autenticar...');
  try {
    const authRes = await fetch('http://localhost:3055/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'local',
        email: 'admin@cpopm.local',
        password: 'Admin@123'
      })
    });

    if (!authRes.ok) {
      const text = await authRes.text();
      throw new Error(`Falha no login: ${authRes.status} ${authRes.statusText} - ${text}`);
    }

    const authData = await authRes.json();
    token = authData.tokens.accessToken;
    
    if (authData.user.tenants.length > 0) {
        tenantId = authData.user.tenants[0].id;
    }
    
    console.log(`Autenticado com sucesso. Token recebido. Tenant ID: ${tenantId}`);

  } catch (e) {
    console.error('Erro crítico na autenticação:', e);
    return;
  }

  
  // 2. Chamar IA com retry
  while (attempts < maxAttempts) {
    try {
      console.log(`Tentativa ${attempts + 1} de ${maxAttempts} chamando IA...`);
      
      const response = await fetch('http://localhost:3055/v1/triagem/demandas/3/sugestao-encaminhamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
         console.log('Token expirado ou inválido (401) durante chamada.');
         return;
      }
      
      if (response.status === 404) {
          console.error('Demanda ID 3 não encontrada (404). Verifique se o ID existe no banco.');
          return;
      }

      if (!response.ok) {
        if (response.status === 500 || response.status === 503) {
            const text = await response.text();
            console.error(`Erro de servidor (${response.status}):`, text);
            if (attempts === maxAttempts - 1) return;
        } else {
            console.error(`Erro na requisição: ${response.status} ${response.statusText}`);
             const text = await response.text();
             console.error(text);
             return;
        }
      } else {
        const data = await response.json();
        console.log('Sucesso! Resposta da IA:');
        console.log(JSON.stringify(data, null, 2));
        return;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('Backend indisponível, aguardando...');
      } else {
        console.error('Erro inesperado:', error);
      }
    }
    
    await wait(3000);
    attempts++;
  }
  console.log('Desistindo após várias tentativas.');
}

testAi();
