import type { MetaFunction } from "@remix-run/node";
import {
  Form,
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import styles from "./tailwind.css";
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "DEV x Atlas Hackathon",
  viewport: "width=device-width,initial-scale=1",
});

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <header className="mx-auto w-11/12 py-4 flex items-center border-b-[1px]">
          <Link to="/" className="">
            <img
              src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
              alt=""
              className="h-8 w-auto"
            />
          </Link>
          <div className="ml-auto flex items-center gap-6">
            <Form action="/search" method="get" className="w-full flex gap-2">
              <label htmlFor="search" className="sr-only">
                Search Webinars
              </label>
              <input
                type="search"
                name="q"
                id="search"
                placeholder="Search webinars"
              />
              <button className="flex items-center ">
                <MagnifyingGlassIcon
                  className="h-6 w-6 text-gray-400 hover:text-gray-500"
                  aria-hidden="true"
                />
              </button>
            </Form>
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
        </header>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
