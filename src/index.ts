import runExtension from "roamjs-components/util/runExtension";
import { render as renderToast } from "roamjs-components/components/Toast";

export default runExtension(async ({ extensionAPI }) => {
  if (process.env.NODE_ENV === "development") {
    renderToast({
      id: "extension-base-loaded",
      content: "Successfully loaded {Extension Name}",
      intent: "success",
      timeout: 500,
    });
  }

  // extensionAPI.settings.panel.create({
  //   tabTitle: "Extension",
  //   settings: [
  //     {
  //       id: "enabled",
  //       name: "Enable",
  //       description: "Turn the extension on or off",
  //       action: { type: "switch" },
  //     },
  //   ],
  // });

  // Add your extension logic here.
  // Add components to /components
  // Add utils to /utils
  // Add types to /types
  // Add styles to /styles
  // keep index.ts simple, clean, easy to read and focused on the extension logic.
  // Use roamjs-components: dom/*, queries/*, writes/*, util/*, components/*

  return {
    unload: () => {
      // Clean up observers, listeners, command palette, etc.
    },
  };
});
