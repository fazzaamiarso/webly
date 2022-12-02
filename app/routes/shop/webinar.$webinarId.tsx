import { VideoCameraIcon } from "@heroicons/react/24/outline";
import type { Ticket } from "@prisma/client";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import dayjs from "dayjs";
import invariant from "tiny-invariant";
import { prisma } from "~/lib/prisma.server";
import { authenticator } from "~/utils/auth.server";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await authenticator.isAuthenticated(request);

  invariant(params.webinarId, `Expected ${params.webinarId}!`);
  invariant(typeof user?.userId === "string", "Illegal Action, must have a user!");

  const webinar = await prisma.webinar.findUnique({
    where: { id: params.webinarId },
    include: { Tickets: true, seller: { select: { name: true } } },
  });

  const cart = await prisma.cart.findMany({
    where: { userId: user.userId },
    select: { quantity: true, ticketId: true },
  });

  return json({ webinar, cart });
};

export const action = async ({ request }: ActionArgs) => {
  const user = await authenticator.isAuthenticated(request);
  const formData = await request.formData();
  const ticketId = formData.get("ticket-id");

  invariant(typeof ticketId === "string", "ticketId must be a string");
  invariant(typeof user?.userId === "string", "Illegal Action, must have a user!");

  await prisma.cart.upsert({
    where: { userId_ticketId: { ticketId, userId: user.userId } },
    create: { ticketId, quantity: 1, userId: user.userId },
    update: { quantity: { increment: 1 } },
  });

  return json(null);
};

export default function WebinarDetails() {
  const { webinar, cart } = useLoaderData<typeof loader>();

  return (
    <main className="w-11/12 mx-auto space-y-12 md:space-y-0 md:grid md:grid-cols-2 md:gap-8 pt-8">
      <section className="space-y-10">
        <div>
          <h2 className="font-bold mb-2 text-3xl">{webinar?.name}</h2>
          <p className="mb-4">{webinar?.description}</p>
          <p className="flex items-center gap-2">
            <VideoCameraIcon className="h-5 aspect-square" /> Meeting via Zoom
          </p>
        </div>
        <div>
          <h3>
            Hosted by <span className="font-semibold">{webinar?.seller.name}</span>
          </h3>
        </div>
        <div className="w-full">
          <h3 className="text-lg font-semibold mb-2">Schedules</h3>
          {webinar && (
            <div className="w-full grid grid-cols-2 items-center gap-6 mb-6">
              <ScheduleItem title="Registration Open" dateString={webinar.registrationOpen} />
              <ScheduleItem title="Registration Closed" dateString={webinar.registrationClosed} />
              <ScheduleItem title="Start Date" dateString={webinar.startDate} />
            </div>
          )}
        </div>
        <TicketSelect tickets={webinar?.Tickets ?? []} cart={cart ?? []} />
      </section>
      <section className="">
        <div className="">
          <img src={webinar?.coverImg} alt="" className="rounded-md" />
        </div>
      </section>
    </main>
  );
}

const ScheduleItem = ({ title, dateString }: { title: string; dateString: string }) => {
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <div>{dayjs(dateString).format("D MMMM YYYY")}</div>
    </div>
  );
};

const TicketSelect = ({
  tickets,
  cart,
}: {
  tickets: Ticket[];
  cart: { quantity: number; ticketId: string }[];
}) => {
  const fetcher = useFetcher();

  const isBusy = fetcher.state !== "idle";
  const ticketPriceAscending = tickets.sort((a, b) => a.price - b.price);

  return (
    <ul className="grid md:grid-cols-2 gap-x-4 items-start">
      {ticketPriceAscending.map((t) => {
        const ticketInCart = cart.find((c) => c.ticketId === t.id)?.quantity ?? 0;
        const canAddToCart = ticketInCart < t.stock;
        return (
          <li
            key={t.id}
            className="p-4 rounded-md ring-1 ring-gray-400 w-full space-y-2 self-stretch cursor-pointer"
          >
            <fetcher.Form
              replace
              method="post"
              className="flex flex-col justify-between h-full gap-6"
            >
              <input type="text" hidden defaultValue={t.id} name="ticket-id" />
              <div>
                <div className="font-semibold">{t.price === 0 ? "Free" : `$${t.price}`}</div>
                <p className="text-sm pb-2">{t.description}</p>
                <div className="text-sm font-semibold">{t.stock} tickets left</div>
              </div>
              <button
                className={clsx(
                  "w-full bg-black text-white py-2 rounded-md",
                  !canAddToCart && "opacity-50"
                )}
                disabled={!canAddToCart || isBusy}
              >
                Add to cart
              </button>
            </fetcher.Form>
          </li>
        );
      })}
    </ul>
  );
};
