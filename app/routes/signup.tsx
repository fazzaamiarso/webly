import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { authenticator } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, { successRedirect: "/shop" });
  return null;
};

export const action = async ({ request }: ActionArgs) => {
  return await authenticator.authenticate("user-pass", request, {
    successRedirect: "/",
  });
};

export default function Signup() {
  return (
    <main className="flex min-h-screen w-screen items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-8  rounded-md">
        <div className="text-center">
          <h2 className="text-4xl font-bold">Sign up to Webly</h2>
          <p>
            or{" "}
            <Link to="/signin" className="text-blue-500">
              sign in here
            </Link>
          </p>
        </div>
        <Form method="post" className="w-full space-y-6 rounded-md p-8 ring-1 ring-gray-300">
          <input type="text" hidden name="auth-type" defaultValue="signup" />
          <div className="">
            <label htmlFor="email">Email address</label>
            <input
              type="text"
              id="email"
              name="email"
              className="block w-full rounded-md border-gray-400"
            />
          </div>
          <div className="">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="block w-full rounded-md border-gray-400"
            />
          </div>
          <button className="w-full rounded-md bg-black p-2 text-white">Sign up</button>
        </Form>
      </div>
    </main>
  );
}
