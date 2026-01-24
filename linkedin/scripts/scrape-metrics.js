const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  // Configuração
  const authFile = path.join(__dirname, 'linkedin-auth.json');
  const profileUrl = 'https://www.linkedin.com/in/rtcoutinho/recent-activity/all/';
  
  // Verificar se já tem autenticação salva
  let browser, context, page;
  
  try {
    browser = await chromium.launch({ headless: false });
    
    // Tentar usar estado salvo
    if (fs.existsSync(authFile)) {
      console.log('Usando autenticação salva...');
      const storageState = JSON.parse(fs.readFileSync(authFile, 'utf8'));
      context = await browser.newContext({ storageState });
      page = await context.newPage();
    } else {
      console.log('Fazendo login manual...');
      context = await browser.newContext();
      page = await context.newPage();
      
      // Navegar para login
      await page.goto('https://www.linkedin.com/login');
      
      // Esperar login manual (usuário precisa fazer)
      console.log('Por favor, faça login no LinkedIn. Após o login, pressione ENTER para continuar...');
      
      // Esperar até que o usuário esteja logado
      await page.waitForURL('**/feed/**', { timeout: 0 });
      
      // Salvar estado
      const storageState = await context.storageState();
      fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
      console.log('Autenticação salva!');
    }
    
    // Navegar para a página de atividade
    console.log('Navegando para página de atividade...');
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Esperar carregar conteúdo
    await page.waitForTimeout(5000);
    
    // Procurar o post sobre EKS - tentar múltiplos seletores
    console.log('Procurando posts...');
    let postsFound = false;
    
    // Tentar diferentes seletores para posts
    const selectors = [
      'div[data-id*="activity"]',
      '.feed-shared-update-v2',
      '[data-urn*="activity"]',
      '.feed-shared-mini-update-v2',
      '.feed-shared-text-update-v2'
    ];
    
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        postsFound = true;
        console.log(`Posts encontrados com seletor: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!postsFound) {
      console.log('Tirando screenshot para debug...');
      await page.screenshot({ path: 'debug.png', fullPage: true });
      console.log('Screenshot salvo como debug.png');
      
      // Tentar extrair qualquer texto da página
      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('Texto da página (primeiros 1000 chars):');
      console.log(pageText.substring(0, 1000));
      
      throw new Error('Nenhum post encontrado');
    }
    
    // Extrair métricas
    const posts = await page.evaluate(() => {
      const results = [];
      const posts = document.querySelectorAll('.feed-shared-update-v2');
      
      console.log(`Encontrados ${posts.length} posts`);
      
      posts.forEach((post, index) => {
        const text = post.innerText || '';
        console.log(`Post ${index}: ${text.substring(0, 200)}...`);
        
        if (text.includes('EKS') || text.includes('Enterprise Knowledge System') || text.includes('ontologia corporativa')) {
          // Tentar encontrar métricas
          const metrics = {
            text: text.substring(0, 500) + '...',
            reactions: 0,
            comments: 0,
            shares: 0,
            impressions: 0
          };
          
          // Procurar botões de reação
          const reactionButtons = post.querySelectorAll('[aria-label*="reaction"], [aria-label*="like"], [aria-label*="curtir"], [aria-label*="reage"]');
          reactionButtons.forEach(btn => {
            const label = btn.getAttribute('aria-label') || '';
            const match = label.match(/(\d+)/);
            if (match) metrics.reactions += parseInt(match[1]);
          });
          
          // Procurar comentários
          const commentElements = post.querySelectorAll('[aria-label*="comment"], [aria-label*="comentário"], [aria-label*="comment"]');
          commentElements.forEach(btn => {
            const label = btn.getAttribute('aria-label') || '';
            const match = label.match(/(\d+)/);
            if (match) metrics.comments += parseInt(match[1]);
          });
          
          // Procurar compartilhamentos
          const shareElements = post.querySelectorAll('[aria-label*="share"], [aria-label*="compartilhar"], [aria-label*="repost"]');
          shareElements.forEach(btn => {
            const label = btn.getAttribute('aria-label') || '';
            const match = label.match(/(\d+)/);
            if (match) metrics.shares += parseInt(match[1]);
          });
          
          // Procurar impressões
          const impressionElements = post.querySelectorAll('[aria-label*="impression"], [aria-label*="view"], [aria-label*="visualização"]');
          impressionElements.forEach(btn => {
            const label = btn.getAttribute('aria-label') || '';
            const match = label.match(/(\d+(?:,\d+)*)/);
            if (match) metrics.impressions += parseInt(match[1].replace(',', ''));
          });
          
          results.push(metrics);
        }
      });
      
      return results;
    });
    
    console.log('\n=== MÉTRICAS ENCONTRADAS ===');
    posts.forEach((post, index) => {
      console.log(`\nPost ${index + 1}:`);
      console.log(`Texto: ${post.text.substring(0, 200)}...`);
      console.log(`Reações: ${post.reactions}`);
      console.log(`Comentários: ${post.comments}`);
      console.log(`Compartilhamentos: ${post.shares}`);
    });
    
    // Tentar clicar no post para ver analytics
    if (posts.length > 0) {
      console.log('\nTentando acessar analytics...');
      
      // Usar o seletor correto para clicar no post
      const firstPost = await page.locator('.feed-shared-update-v2').first();
      await firstPost.click();
      
      // Esperar carregar página do post
      await page.waitForTimeout(3000);
      
      // Procurar botão de analytics
      const analyticsButton = await page.locator('[aria-label*="analytics"], [aria-label*="insights"], button:has-text("View analytics"), button:has-text("Ver análises")').first();
      
      if (await analyticsButton.isVisible()) {
        await analyticsButton.click();
        await page.waitForTimeout(2000);
        
        // Extrair métricas detalhadas
        const detailedMetrics = await page.evaluate(() => {
          const metrics = {};
          
          // Procurar elementos com métricas
          const metricElements = document.querySelectorAll('[data-urn*="impression"], [data-urn*="view"], [data-urn*="engagement"]');
          
          metricElements.forEach(el => {
            const text = el.innerText || '';
            if (text.includes('impression') || text.includes('view')) {
              const match = text.match(/(\d+(?:,\d+)*)/);
              if (match) metrics.impressions = parseInt(match[1].replace(',', ''));
            }
            if (text.includes('engagement')) {
              const match = text.match(/(\d+(?:\.\d+)?%)/);
              if (match) metrics.engagement = match[1];
            }
          });
          
          return metrics;
        });
        
        console.log('\n=== MÉTRICAS DETALHADAS ===');
        console.log(detailedMetrics);
      } else {
        console.log('Botão de analytics não encontrado');
        
        // Tentar extrair métricas diretamente da página
        const pageMetrics = await page.evaluate(() => {
          const text = document.body.innerText;
          const metrics = {};
          
          // Procurar padrões de métricas no texto
          const impressions = text.match(/(\d+(?:,\d+)*)\s*(?:impressões|impressions|visualizações)/i);
          const reactions = text.match(/(\d+)\s*(?:reações|reactions|likes)/i);
          const comments = text.match(/(\d+)\s*(?:comentários|comments)/i);
          
          if (impressions) metrics.impressions = parseInt(impressions[1].replace(',', ''));
          if (reactions) metrics.reactions = parseInt(reactions[1]);
          if (comments) metrics.comments = parseInt(comments[1]);
          
          return metrics;
        });
        
        console.log('\n=== MÉTRICAS EXTRAÍDAS DA PÁGINA ===');
        console.log(pageMetrics);
      }
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await browser.close();
  }
})();
