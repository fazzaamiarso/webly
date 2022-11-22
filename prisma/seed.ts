import { Category, PrismaClient, TicketType } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const randomCategory = () =>
  faker.helpers.arrayElement(Object.values(Category));

const randomType = () => faker.helpers.arrayElement(Object.values(TicketType));

const runSeed = async () => {
  console.log("🌱 Start Seeding!");

  console.log("Creating Webinars!");
  await prisma.webinar.createMany({
    data: faker.datatype.array(5).map((_) => {
      return {
        coverImg: faker.image.food(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        type: randomType(),
        EndDate: faker.date.future(),
        startDate: faker.date.future(),
        registrationClosed: faker.date.future(),
        category: randomCategory(),
      };
    }),
  });
};

runSeed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
