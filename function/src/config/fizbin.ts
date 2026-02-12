// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default () => ({
   port: parseInt(process.env.PORT ?? "0", 10) !== 0 || 3000,
   database: {
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT ?? "0", 10) !== 0 || 5432,
   },
})
