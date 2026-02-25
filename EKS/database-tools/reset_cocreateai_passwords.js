const neo4j = require('neo4j-driver');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../backend/.env' });

const EMAILS = [
  'trindade@cocreateai.com.br',
  'julio@cocreateai.com.br',
  'milena@cocreateai.com.br',
];

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const newPassword = getArgValue('--password') || process.argv[2] || 'EKB123';
  const allowPartial = process.argv.includes('--allow-partial');

  if (!process.env.NEO4J_URI || !process.env.NEO4J_USERNAME || !process.env.NEO4J_PASSWORD) {
    console.error('❌ Variáveis NEO4J_* não encontradas. Confira EKS/backend/.env');
    process.exit(1);
  }

  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  );

  const session = driver.session();

  try {
    const check = await session.run(
      `
      MATCH (u:User)
      WHERE toLower(u.email) IN $emails
      RETURN collect(toLower(u.email)) AS found
      `,
      { emails: EMAILS.map((e) => e.toLowerCase()) }
    );

    const found = (check.records[0]?.get('found') || []).sort();
    const expected = EMAILS.map((e) => e.toLowerCase()).sort();
    const missing = expected.filter((e) => !found.includes(e));

    if (missing.length > 0 && !allowPartial) {
      console.error('❌ Nem todos os usuários foram encontrados. Faltando:');
      for (const m of missing) console.error(`   - ${m}`);
      console.error('\nSe quiser resetar apenas os existentes, rode com: --allow-partial');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const result = await session.run(
      `
      MATCH (u:User)
      WHERE toLower(u.email) IN $emails
      SET u.passwordHash = $passwordHash,
          u.forcePasswordChange = true,
          u.updatedAt = datetime()
      RETURN u.email AS email, u.role AS role
      ORDER BY email
      `,
      { emails: EMAILS.map((e) => e.toLowerCase()), passwordHash }
    );

    console.log('✅ Senha resetada para:');
    for (const r of result.records) {
      console.log(`   - ${r.get('email')} (${r.get('role')})`);
    }

    console.log('\n🔑 Nova senha temporária definida (para as contas acima).');
  } catch (err) {
    console.error('❌ Erro ao resetar senha:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await session.close();
    await driver.close();
  }
}

main();


