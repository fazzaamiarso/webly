import { Combobox } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  Form,
  useFetcher,
  useSubmit,
  Outlet,
  useLoaderData,
} from "@remix-run/react";
import type { loader as SearchLoader } from "~/routes/shop/search";
import { authenticator } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await authenticator.isAuthenticated(request);
  return json({ email: user?.email ?? null });
};

export default function ShopLayout() {
  const submit = useSubmit();
  const user = useLoaderData<typeof loader>();
  const webinars = useFetcher<typeof SearchLoader>();
  return (
    <>
      <header className="w-full">
        <div className="bg-[#111828] py-2">
          <div className="w-11/12 mx-auto flex items-center">
            {user.email ? (
              <div className="ml-auto space-x-8 flex items-center">
                <p className="text-white text-sm">Hello, {user.email}</p>
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
        <div className="mx-auto w-11/12 py-4 flex items-center border-b-[1px] gap-8">
          <Link to="/" className="">
            <img
              src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
              alt=""
              className="h-8 w-auto"
            />
          </Link>
          <Form
            action="/shop/search"
            method="get"
            className="w-full flex gap-2"
          >
            <Combobox
              nullable
              as="div"
              className="w-full relative"
              onChange={(e) => {
                if (!e) return;
                submit(new URLSearchParams({ q: e as string }), {
                  action: "/shop/search",
                });
              }}
            >
              <Combobox.Input
                name="q"
                placeholder="Search webinars"
                autoComplete="off"
                className="w-full relative"
                onChange={(e) => {
                  if (e.target.value === "") return;
                  webinars.load(`/api/autocomplete?q=${e.target.value}`);
                }}
              />
              <Combobox.Options className="absolute bottom-0 left-0 w-full translate-y-full bg-white shadow-lg p-4 space-y-2">
                {webinars.data?.length === 0 && webinars.type === "done" && (
                  <p>No Webinars Found</p>
                )}
                {webinars.data?.map((w) => {
                  return (
                    <Combobox.Option key={w._id} value={w.name}>
                      {w.name}
                    </Combobox.Option>
                  );
                })}
              </Combobox.Options>
            </Combobox>
            <button type="submit" className="flex items-center">
              <MagnifyingGlassIcon
                className="h-6 w-6 text-gray-400 hover:text-gray-500"
                aria-hidden="true"
              />
            </button>
          </Form>
          <div className="ml-auto flex items-center gap-6">
            <button className="flex items-center ">
              <ShoppingBagIcon
                className="h-6 w-6 text-gray-400 hover:text-gray-500"
                aria-hidden="true"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-800">
                0
              </span>
              <span className="sr-only">items in cart, view bag</span>
            </button>
          </div>
        </div>
      </header>
      <Outlet />
      <footer></footer>
    </>
  );
}
