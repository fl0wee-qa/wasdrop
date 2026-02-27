param(
  [switch]$WithDocker
)

if ($WithDocker) {
  docker compose up -d postgres
}

npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
