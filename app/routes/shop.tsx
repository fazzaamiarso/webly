import { Combobox } from "@headlessui/react";
import { MagnifyingGlassIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
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
  useFetchers,
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
  const fetchers = useFetchers();
  const user = useLoaderData<typeof loader>();

  let cartCount = 0;
  for (let f of fetchers) {
    if (f.submission && user.cartItemsCount && f.submission.formData.get("action") === "add-cart") {
      cartCount = user.cartItemsCount + 1;
    }
  }

  return (
    <>
      <header className="relative z-10 mb-4 w-full border-b-[2px] border-gray-200 bg-white">
        <div className="bg-primary py-2">
          <div className="mx-auto flex w-11/12 items-center">
            {user.email ? (
              <div className="ml-auto flex items-center space-x-8">
                <p className="flex items-center gap-2 text-sm text-white">
                  <UserIcon className="h-3" /> <span>{user.email}</span>
                </p>
                <Form action="/api/logout" method="post">
                  <button className="text-sm text-white">Logout</button>
                </Form>
              </div>
            ) : (
              <div className="ml-auto space-x-6">
                <Link to="/signin" className="text-sm text-white ">
                  Sign in
                </Link>
                <Link to="/signup" className="text-sm text-white">
                  Create an account
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="mx-auto flex w-11/12 items-center gap-8  bg-white   py-4 ">
          <h1>
            <Link to="/" className="text-4xl font-bold">
              Webly
            </Link>
          </h1>

          <SearchAutocomplete />
          <div className="ml-auto flex items-center gap-6">
            <Link to="/shop/cart" className="flex items-center ">
              <ShoppingBagIcon
                className="h-6 w-6 text-gray-400 hover:text-gray-500"
                aria-hidden="true"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-800">
                {cartCount > 0 ? cartCount : user.cartItemsCount}
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
    searchParams.delete("q");
    searchParams.delete("intent");
    value.name && searchParams.append("q", value.name);
    searchParams.append("intent", value.type);

    setQuery(value.name);
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
    <Form action={searchPath} method="get" className="relative flex w-full max-w-lg gap-2">
      <input
        type="text"
        hidden
        name="intent"
        defaultValue={searchParams.get("intent") ?? "webinar"}
      />
      <Combobox nullable as="div" className="relative w-full" onChange={onSelect}>
        {({ open }) => {
          return (
            <>
              {open && <Overlay />}
              <Combobox.Input
                name="q"
                value={query}
                displayValue={() => query}
                placeholder="Search webinars and hosts"
                autoComplete="off"
                className="relative w-full rounded-sm border-none bg-[#f3f3f6] py-3 focus-within:ring-2"
                onChange={onInputChange}
              />

              <Combobox.Options className="absolute bottom-0 left-0 z-50 w-full translate-y-[105%] space-y-2 rounded-md bg-white p-4 shadow-lg">
                {webinars.map((w) => {
                  return (
                    <Combobox.Option
                      key={w._id}
                      value={w}
                      className={({ active }) => clsx("rounded-sm p-2", active && "bg-[#f3f3f6]")}
                    >
                      <span className="text-sm font-semibold">{w.name}</span>{" "}
                      <span className="ml-2 text-sm text-gray-600">in {w.type}</span>
                    </Combobox.Option>
                  );
                })}
                <Combobox.Option
                  value={{ name: null, type: "webinar" }}
                  className={({ active }) =>
                    clsx(
                      "flex items-center justify-between rounded-sm p-2",
                      active && "bg-[#f3f3f6]"
                    )
                  }
                >
                  <span className="text-sm">Search All</span>
                  <ChevronRightIcon className="aspect-square h-5" aria-hidden="true" />
                </Combobox.Option>
                <Combobox.Option
                  value={{ name: "", type: "webinar" }}
                  className={({ active }) =>
                    clsx(
                      "flex items-center justify-between rounded-sm p-2",
                      active && "bg-[#f3f3f6]"
                    )
                  }
                >
                  <span className="text-sm">Show results for '{query}'</span>
                  <ChevronRightIcon className="aspect-square h-5" aria-hidden="true" />
                </Combobox.Option>
              </Combobox.Options>
            </>
          );
        }}
      </Combobox>
      {showSpinner ? (
        <div className="absolute right-0 bottom-0 z-10 -translate-y-1/2 px-4">
          <Spinner />
        </div>
      ) : (
        <button
          type="submit"
          className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center rounded-full p-2 ring-2 ring-transparent transition-all  hover:bg-gray-300  active:ring-purple-400"
        >
          <MagnifyingGlassIcon className="h-6 w-6 " aria-hidden="true" />
        </button>
      )}
    </Form>
  );
};

const Spinner = () => {
  return (
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
  );
};

const Overlay = () => {
  const portalRoot = document.getElementById("overlay-root");
  if (!portalRoot) return null;

  return createPortal(
    <div className="fixed inset-0 left-0 top-0 bg-gray-700 bg-opacity-75" />,
    portalRoot
  );
};
