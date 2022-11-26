import { Link } from "@remix-run/react";

type WebinarItemsProps = {
  id: string;
  cover: string;
  name: string;
  tickets: { price: number }[];
};

export const WebinarItem = ({
  id,
  cover,
  name,
  tickets,
}: WebinarItemsProps) => {
  const priceText =
    tickets.length > 1 ? `from $${tickets[0]}` : `$${tickets[0].price}`;
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
        <div className="flex w-full justify-between text-sm">
          <div className="">
            <p className="font-medium md:text-base line-clamp-1">{name}</p>
            <p className="">Webinar host</p>
          </div>
          <span className="ml-auto md:text-base">{priceText}</span>
        </div>
      </Link>
    </li>
  );
};
