import runExtension from "roamjs-components/util/runExtension";
import { render as renderToast } from "roamjs-components/components/Toast";
import { createFindInPage, FIND_IN_PAGE_COMMAND_LABELS } from "~/findInPage";

export default runExtension(async ({ extensionAPI }) => {
  if (process.env.NODE_ENV === "development") {
    renderToast({
      id: "find-in-page-loaded",
      content: "Successfully loaded Find In Page",
      intent: "success",
      timeout: 500,
    });
  }

  const findInPage = await createFindInPage({ extensionAPI });

  return {
    commands: [...FIND_IN_PAGE_COMMAND_LABELS],
    unload: () => {
      findInPage.unload();
    },
  };
});
