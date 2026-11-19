import { useCallback } from "react";
import { useDispatch } from "react-redux";

import { AppDispatch } from "../store/store";
import { ConsoleMessageType, onAddConsoleMessage } from "../reduser/reduser";

/**
 * Writes a line to the FunChat console (bottom of the chat list) and opens it.
 *
 *   const notify = useNotify();
 *
 *   notify("error", "Couldn't send the message");
 *   notify("success", "The chat has been deleted");
 *   notify("info", "FUNner started a chat with you");
 *
 * Use it in catch blocks instead of returning nothing.
 */
export function useNotify() {
  const dispatch = useDispatch<AppDispatch>();

  return useCallback(
    (type: ConsoleMessageType, text: string) => {
      dispatch(onAddConsoleMessage({ type, text }));
    },
    [dispatch]
  );
}