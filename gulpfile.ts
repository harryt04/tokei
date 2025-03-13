import { task } from 'gulp'
import { createMongoDbIndexes } from './lib/mongo-utils'

task('create-indexes', async () => {
  await createMongoDbIndexes(`tokei-development`)
  await createMongoDbIndexes(`tokei-production`)
})
