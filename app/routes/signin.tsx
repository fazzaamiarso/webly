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
    <main className="w-screen min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto rounded-md  space-y-8">
        <div className="text-center">
          <h2 className="font-bold text-4xl">Sign in to Webly</h2>
          <p>
            or{" "}
            <Link to="/signup" className="text-blue-500">
              signup here
            </Link>
          </p>
        </div>
        <Form
          method="post"
          className="space-y-6 ring-1 p-8 rounded-md ring-black w-full"
        >
          <input type="text" hidden name="auth-type" defaultValue="signin" />
          <div className="">
            <label htmlFor="email">Email address</label>
            <input
              type="text"
              id="email"
              name="email"
              className="w-full block rounded-md"
            />
          </div>
          <div className="">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full block rounded-md"
            />
          </div>
          <div className="flex w-full justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="remember-me"
                id="remember-me"
                className="rounded-sm h-4 w-4 "
              />
              <label htmlFor="remember-me" className="text-sm">
                Remember me
              </label>
            </div>
            <button type="button" className="text-sm text-blue-500 font-medium">
              Forgot your password?
            </button>
          </div>
          <button className="w-full bg-black text-white p-2 rounded-md">
            Sign in
          </button>
        </Form>
      </div>
    </main>
  );
}
