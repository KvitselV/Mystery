import { redisClient, connectRedis } from '../src/config/redis';

async function main() {
  try {
    await connectRedis();

    const keys = await redisClient.keys('tournament:live:*');
    console.log('LiveState keys:', keys);

    for (const key of keys) {
      const value = await redisClient.get(key);
      console.log(`\n${key}:`);
      console.log(value);
    }

    await redisClient.quit();
  } catch (err) {
    console.error('Error inspecting Redis:', err);
  }
}

main();
