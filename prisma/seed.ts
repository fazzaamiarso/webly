import type { Prisma } from "@prisma/client";
import { Category, PrismaClient, TicketType } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const randomCategory = () =>
  faker.helpers.arrayElement(Object.values(Category));

const randomType = () => faker.helpers.arrayElement(Object.values(TicketType));

const fakeWebinars = faker.datatype.array(30).map((_) => {
  return {
    id: faker.database.mongodbObjectId(),
    coverImg: faker.image.food(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    type: randomType(),
    endDate: faker.date.future(),
    startDate: faker.date.future(),
    registrationClosed: faker.date.future(),
    category: randomCategory(),
  } as Prisma.WebinarCreateManyInput;
});

const runSeed = async () => {
  await prisma.user.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.webinar.deleteMany();

  console.log("🌱 Start Seeding!");

  console.log("Creating Webinars!");
  await prisma.webinar.createMany({
    data: fakeWebinars,
  });
  console.log("Creating Webinars Done!");
  console.log("Creating Tickets!");
  for (let w of fakeWebinars) {
    await prisma.ticket.create({
      data: {
        webinarId: w.id as string,
        description: faker.commerce.productDescription(),
        stock: faker.datatype.number(10),
        price: faker.datatype.number(30),
      },
    });
  }
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
