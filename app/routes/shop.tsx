import { Combobox } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { ChevronRightIcon, UserIcon } from "@heroicons/react/24/solid";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  Form,
  useFetcher,
  useSubmit,
  Outlet,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import clsx from "clsx";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useSpinDelay } from "spin-delay";
import { Footer } from "~/components/footer";
import { prisma } from "~/lib/prisma.server";
import type { loader as autocompleteLoader } from "~/routes/api/autocomplete";
import { authenticator } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
  const savedUser = await authenticator.isAuthenticated(request);
  if (!savedUser)
    return json({
      email: null,
      cartItemsCount: 0,
    });

  const user = await prisma.user.findUnique({
    where: { email: savedUser?.email },
    select: { cart: { select: { quantity: true } } },
  });

  return json({
    email: savedUser.email,
    cartItemsCount: user?.cart.reduce((acc, curr) => acc + curr.quantity, 0),
  });
};

export default function ShopLayout() {
  const user = useLoaderData<typeof loader>();

  return (
    <>
      <header className="w-full border-b-[2px] border-gray-200 mb-4 relative z-10 bg-white">
        <div className="bg-primary py-2">
          <div className="w-11/12 mx-auto flex items-center">
            {user.email ? (
              <div className="ml-auto space-x-8 flex items-center">
                <p className="text-white text-sm flex items-center gap-2">
                  <UserIcon className="h-3" /> <span>{user.email}</span>
                </p>
                <Form action="/api/logout" method="post">
                  <button className="text-white text-sm">Logout</button>
                </Form>
              </div>
            ) : (
              <div className="ml-auto space-x-6">
                <Link to="/signin" className="text-white text-sm ">
                  Sign in
                </Link>
                <Link to="/signup" className="text-white text-sm">
                  Create an account
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="mx-auto w-11/12 py-4 flex items-center  gap-8   bg-white ">
          <Link to="/" className="">
            <img
              src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
              alt=""
              className="h-8 w-auto"
            />
          </Link>
          <SearchAutocomplete />
          <div className="ml-auto flex items-center gap-6">
            <Link to="/shop/cart" className="flex items-center ">
              <ShoppingBagIcon
                className="h-6 w-6 text-gray-400 hover:text-gray-500"
                aria-hidden="true"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-800">
                {user.cartItemsCount}
              </span>
              <span className="sr-only">items in cart, view bag</span>
            </Link>
          </div>
        </div>
      </header>
      <Outlet />
      <Footer />
    </>
  );
}

const SearchAutocomplete = () => {
  const searchPath = "/shop/search";
  const submit = useSubmit();
  const webinarFetcher = useFetcher<typeof autocompleteLoader>();
  const webinars = webinarFetcher.data ?? [];

  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");

  const isBusy = webinarFetcher.state !== "idle";
  const showSpinner = useSpinDelay(isBusy, { delay: 150, minDuration: 500 });

  const onSelect = (value: { name: string; type: string }) => {
    if (!value) return;
    searchParams.delete("q");
    searchParams.delete("intent");
    searchParams.append("q", value.name);
    searchParams.append("intent", value.type);

    submit(searchParams, {
      action: searchPath,
    });
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputQuery = e.target.value;
    if (inputQuery === "") return;
    setQuery(inputQuery);
    webinarFetcher.load(`/api/autocomplete?q=${inputQuery}`);
  };

  return (
    <Form action={searchPath} method="get" className="w-full flex gap-2 relative max-w-lg">
      <Combobox nullable as="div" className="w-full relative" onChange={onSelect}>
        {({ open }) => {
          return (
            <>
              {open && <Overlay />}
              <Combobox.Input
                name="q"
                placeholder="Search webinars and hosts"
                autoComplete="off"
                className="w-full relative bg-[#f3f3f6] border-none py-3 rounded-sm focus-within:ring-2"
                onChange={onInputChange}
              />

              <Combobox.Options className="absolute bottom-0 left-0 w-full z-50 rounded-md translate-y-[105%] bg-white shadow-lg p-4 space-y-2">
                {webinars.map((w) => {
                  return (
                    <Combobox.Option
                      key={w._id}
                      value={w}
                      className={({ active }) => clsx("rounded-sm p-2", active && "bg-[#f3f3f6]")}
                    >
                      {w.name}{" "}
                      <span className="text-sm ml-2">
                        in {w.type === "webinar" ? "Webinar" : "Seller"}
                      </span>
                    </Combobox.Option>
                  );
                })}
                <Combobox.Option
                  value={query}
                  className={({ active }) =>
                    clsx(
                      "rounded-sm p-2 flex items-center justify-between",
                      active && "bg-[#f3f3f6]"
                    )
                  }
                >
                  <span>Show results for '{query}'</span>
                  <ChevronRightIcon className="h-5 aspect-square" aria-hidden="true" />
                </Combobox.Option>
              </Combobox.Options>
            </>
          );
        }}
      </Combobox>
      {showSpinner ? (
        <div className="absolute z-10 right-0 px-4 bottom-0 -translate-y-1/2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
              opacity=".25"
            />
            <path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z">
              <animateTransform
                attributeName="transform"
                type="rotate"
                dur="0.75s"
                values="0 12 12;360 12 12"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        </div>
      ) : (
        <button
          type="submit"
          className="flex items-center absolute z-10 right-0 px-4 bottom-0 -translate-y-1/2 "
        >
          <MagnifyingGlassIcon className="h-6 w-6 " aria-hidden="true" />
        </button>
      )}
    </Form>
  );
};

const Overlay = () => {
  const portalRoot = document.getElementById("overlay-root");
  if (!portalRoot) return null;

  return createPortal(
    <div className="fixed left-0 inset-0 top-0 bg-gray-700 bg-opacity-75" />,
    portalRoot
  );
};