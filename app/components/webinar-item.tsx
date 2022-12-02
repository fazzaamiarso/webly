import { Link } from "@remix-run/react";
import dayjs from "dayjs";

type WebinarItemsProps = {
  id: string;
  cover: string;
  name: string;
  startDate: string;
  seller: string;
  tickets: { price: number }[];
};

export const WebinarItem = ({ id, cover, name, tickets, startDate, seller }: WebinarItemsProps) => {
  const priceText =
    tickets?.length > 1
      ? `from ${tickets[0].price === 0 ? "free" : `$${tickets[0].price}`}`
      : `${tickets[0].price === 0 ? "Free" : `$${tickets[0].price}`}`;
  return (
    <li key={id} className="w-full">
      <Link to={`/shop/webinar/${id}`} className="block w-full space-y-2">
        <div className="h-32 w-full overflow-hidden rounded-md sm:h-40">
          <img
            src={cover}
            alt=""
            className="bg-cover bg-center bg-no-repeat transition-all duration-500 hover:scale-110"
          />
        </div>
        <div className="flex w-full justify-between">
          <div className="mb-4">
            <p className="text-sm font-semibold line-clamp-1 md:text-base">{name}</p>
            <p className="text-sm text-gray-600">{seller}</p>
          </div>
        </div>
        <div className="flex w-full">
          <div className="text-sm font-medium md:text-base">{priceText}</div>
          <div className="ml-auto text-sm">{dayjs(startDate).format("D MMM")}</div>
        </div>
      </Link>
    </li>
  );
};
