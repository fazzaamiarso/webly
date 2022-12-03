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

export default function Signin() {
  return (
    <main className="flex min-h-screen w-screen items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-8  rounded-md">
        <div className="text-center">
          <h2 className="text-4xl font-bold">Sign in to Webly</h2>
          <p>
            or{" "}
            <Link to="/signup" className="text-blue-500">
              signup here
            </Link>
          </p>
        </div>
        <Form method="post" className="w-full space-y-6 rounded-md p-8 ring-1 ring-gray-300">
          <input type="text" hidden name="auth-type" defaultValue="signin" />
          <div className="">
            <label htmlFor="email">Email address</label>
            <input
              type="text"
              id="email"
              name="email"
              className="block w-full rounded-md border-gray-400"
              autoComplete="off"
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
          <div className="flex w-full justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="remember-me"
                id="remember-me"
                className="h-4 w-4 rounded-sm "
              />
              <label htmlFor="remember-me" className="text-sm">
                Remember me
              </label>
            </div>
            <button type="button" className="text-sm font-medium text-blue-500">
              Forgot your password?
            </button>
          </div>
          <button className="w-full rounded-md bg-black p-2 text-white">Sign in</button>
        </Form>
      </div>
    </main>
  );
}
