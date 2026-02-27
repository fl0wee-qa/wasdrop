param(
  [switch]$UnitOnly
)

npm run lint

if ($UnitOnly) {
  npm run test:unit
} else {
  npm run test
}
