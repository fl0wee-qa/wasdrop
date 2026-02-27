param(
  [ValidateSet("migrate", "push", "seed", "studio")]
  [string]$Action = "migrate"
)

switch ($Action) {
  "migrate" {
    npm run db:migrate
    break
  }
  "push" {
    npm run db:push
    break
  }
  "seed" {
    npm run db:seed
    break
  }
  "studio" {
    npx prisma studio --hostname 127.0.0.1 --port 5555
    break
  }
}
