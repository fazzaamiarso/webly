import type { Prisma } from "@prisma/client";
import { Category, PrismaClient, TicketType } from "@prisma/client";
import { faker } from "@faker-js/faker";
import mockWebinars from "./data.json";

const prisma = new PrismaClient();

const randomCategory = () =>
  faker.helpers.arrayElement(Object.values(Category));

const randomType = () => faker.helpers.arrayElement(Object.values(TicketType));

const webinarsFromMocks = async (name: string, host: string) => {
  const regOpen = faker.date.future();
  const regClosed = faker.date.future(undefined, regOpen);
  const startDate = faker.date.future(undefined, regClosed);
  const endDate = faker.date.future(undefined, startDate);

  await prisma.webinar.create({
    data: {
      coverImg: faker.image.food(),
      name,
      description: faker.commerce.productDescription(),
      type: randomType(),
      endDate,
      startDate,
      registrationOpen: regOpen,
      registrationClosed: regClosed,
      category: randomCategory(),
      seller: { connectOrCreate: { create: { name: host }, where: { name: host } } },
    },
  });
};

const fakeWebinars = () =>
  faker.datatype.array(3).map((_) => {
    const regOpen = faker.date.future();
    const regClosed = faker.date.future(undefined, regOpen);
    const startDate = faker.date.future(undefined, regClosed);
    const endDate = faker.date.future(undefined, startDate);

    return {
      coverImg: faker.image.food(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      type: randomType(),
      endDate,
      startDate,
      registrationOpen: regOpen,
      registrationClosed: regClosed,
      category: randomCategory(),
    } as Prisma.WebinarCreateManyInput;
  });

const fakeSeller = () =>
  ({
    name: faker.company.name(),
    webinars: { createMany: { data: fakeWebinars() } },
  } as Prisma.SellerCreateInput);

const runSeed = async () => {
  await prisma.user.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.webinar.deleteMany();
  await prisma.ticket.deleteMany();

  console.log("🌱 Start Seeding!");

  console.log("Creating Webinars from mocks!");
  for (let w of mockWebinars) {
    await webinarsFromMocks(w.name, w.host);
  }

  console.log("Creating Sellers with Webinars!");
  for (let _ of Array.from({ length: 10 })) {
    await prisma.seller.create({
      data: fakeSeller(),
    });
  }
  console.log("Creating Sellers Done!");
  console.log("Creating Tickets!");
  const webinars = await prisma.webinar.findMany({
    select: { id: true, type: true },
  });

  for (let w of webinars) {
    if (w.type === "FREE") {
      await prisma.ticket.create({
        data: {
          webinarId: w.id as string,
          description: faker.commerce.productDescription(),
          stock: faker.datatype.number(10),
          price: 0,
          discountActive: faker.datatype.boolean(),
          discountPercent: faker.datatype.float({
            min: 0,
            max: 1,
            precision: 0.01,
          }),
        },
      });
    }

    if (w.type === "MIX") {
      await prisma.ticket.createMany({
        data: [
          {
            webinarId: w.id as string,
            description: faker.commerce.productDescription(),
            stock: faker.datatype.number(10),
            price: 0,
          },
          {
            webinarId: w.id as string,
            description: faker.commerce.productDescription(),
            stock: faker.datatype.number(10),
            price: faker.datatype.number(30),
          },
        ],
      });
    }
    if (w.type === "PAID") {
      await prisma.ticket.createMany({
        data: [
          {
            webinarId: w.id as string,
            description: faker.commerce.productDescription(),
            stock: faker.datatype.number(10),
            price: faker.datatype.number(30),
          },
          {
            webinarId: w.id as string,
            description: faker.commerce.productDescription(),
            stock: faker.datatype.number(10),
            price: faker.datatype.number(30),
          },
        ],
      });
    }
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
