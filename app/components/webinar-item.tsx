import { Link } from "@remix-run/react";
import dayjs from "dayjs";

type WebinarItemsProps = {
  id: string;
  cover: string;
  name: string;
  startDate: string;
  tickets: { price: number }[];
};

export const WebinarItem = ({
  id,
  cover,
  name,
  tickets,
  startDate,
}: WebinarItemsProps) => {
  const priceText =
    tickets?.length > 1 ? `from $${tickets[0]}` : `$${tickets[0].price}`;
  return (
    <li key={id} className="w-full">
      <Link to={`/shop/webinar/${id}`} className="space-y-2 block w-full">
        <div className="h-32 sm:h-40 w-full overflow-hidden rounded-md">
          <img
            src={cover}
            alt=""
            className="bg-cover bg-center bg-no-repeat hover:scale-110 transition-all duration-500"
          />
        </div>
        <div className="flex w-full justify-between ">
          <div className="">
            <p className="font-medium text-sm md:text-base line-clamp-1">
              {name}
            </p>
            <p className="text-sm ">Webinar host</p>
          </div>
        </div>
        <div className="w-full flex">
          <div className="text-sm md:text-base font-medium">{priceText}</div>
          <div className="text-sm ml-auto">
            {dayjs(startDate).format("D MMM")}
          </div>
        </div>
      </Link>
    </li>
  );
};
