import { Button, Card, Icon, InputGroup, Tooltip } from "@blueprintjs/core";
import React, {
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";

export type FindInPagePanelProps = {
  inputRef: RefObject<HTMLInputElement>;
  query: string;
  currentMatch: number;
  matchCount: number;
  onQueryChange: (query: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onFocusCurrent: () => void;
  onClose: () => void;
};

const FOCUS_HINT = "Focus the selected match (Cmd/Ctrl+Enter)";
const STATUS_ID = "roamjs-find-in-page-status";
const IME_PROCESS_KEY_CODE = 229;

type PanelKeyboardEvent = Pick<
  KeyboardEvent<HTMLElement>,
  "key" | "preventDefault"
> &
  Partial<
    Pick<
      KeyboardEvent<HTMLElement>,
      "keyCode" | "defaultPrevented" | "stopPropagation"
    >
  > & {
    nativeEvent?: Partial<
      Pick<
        KeyboardEvent<HTMLElement>["nativeEvent"],
        "isComposing" | "keyCode" | "stopImmediatePropagation"
      >
    >;
  };

const isComposing = (event: PanelKeyboardEvent): boolean =>
  Boolean(
    event.nativeEvent?.isComposing ||
    event.nativeEvent?.keyCode === IME_PROCESS_KEY_CODE ||
    event.keyCode === IME_PROCESS_KEY_CODE,
  );

const consumeKeyboardEvent = (event: PanelKeyboardEvent): void => {
  event.preventDefault();
  event.stopPropagation?.();
  // Roam can register native shortcuts on the same node as React's listener.
  event.nativeEvent?.stopImmediatePropagation?.();
};

export const handleFindInPagePanelKeyDown = ({
  event,
  onClose,
}: {
  event: PanelKeyboardEvent;
  onClose: () => void;
}): void => {
  if (event.key !== "Escape" || event.defaultPrevented || isComposing(event))
    return;
  consumeKeyboardEvent(event);
  onClose();
};

export const handleFindInPageKeyDown = ({
  event,
  onPrevious,
  onNext,
  onFocusCurrent,
  onClose,
}: {
  event: PanelKeyboardEvent &
    Pick<KeyboardEvent<HTMLInputElement>, "shiftKey" | "metaKey" | "ctrlKey">;
  onPrevious: () => void;
  onNext: () => void;
  onFocusCurrent: () => void;
  onClose: () => void;
}): void => {
  if (isComposing(event)) return;

  if (event.key === "Escape") {
    handleFindInPagePanelKeyDown({ event, onClose });
    return;
  }

  if (event.key === "Enter") {
    consumeKeyboardEvent(event);
    if (event.metaKey || event.ctrlKey) {
      onFocusCurrent();
      return;
    }

    if (event.shiftKey) {
      onPrevious();
      return;
    }

    onNext();
    return;
  }

  if (event.key === "ArrowUp") {
    consumeKeyboardEvent(event);
    onPrevious();
    return;
  }

  if (event.key === "ArrowDown") {
    consumeKeyboardEvent(event);
    onNext();
  }
};

export const FindInPagePanel = ({
  inputRef,
  query,
  currentMatch,
  matchCount,
  onQueryChange,
  onPrevious,
  onNext,
  onFocusCurrent,
  onClose,
}: FindInPagePanelProps): React.ReactElement => {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void =>
    handleFindInPageKeyDown({
      event,
      onPrevious,
      onNext,
      onFocusCurrent,
      onClose,
    });

  const preserveInputFocus = (event: MouseEvent<HTMLButtonElement>): void => {
    const input = inputRef.current;
    if (event.button === 0 && input?.ownerDocument.activeElement === input) {
      event.preventDefault();
    }
  };

  const hasMatches = matchCount > 0;
  const hasSelectedMatch =
    hasMatches && currentMatch >= 0 && currentMatch < matchCount;
  const countLabel = !query.trim()
    ? "Type to search"
    : !hasMatches
      ? "No matches"
      : hasSelectedMatch
        ? `${currentMatch + 1} of ${matchCount}`
        : `${matchCount} ${matchCount === 1 ? "match" : "matches"}`;
  const statusLabel = hasSelectedMatch ? `Match ${countLabel}` : countLabel;

  return (
    <Card
      id="roamjs-find-in-page-panel"
      className="roamjs-find-in-page-panel"
      elevation={2}
      role="dialog"
      aria-label="Find in page"
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>): void =>
        handleFindInPagePanelKeyDown({ event, onClose })
      }
    >
      <InputGroup
        inputRef={inputRef}
        value={query}
        leftIcon="search"
        placeholder="Find in page"
        autoComplete="off"
        spellCheck={false}
        aria-label="Find in page query"
        aria-describedby={STATUS_ID}
        onChange={(event): void => onQueryChange(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
      />
      <span
        id={STATUS_ID}
        className="roamjs-find-in-page-count"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={statusLabel}
      >
        {countLabel}
      </span>
      <Button
        minimal
        icon="arrow-up"
        disabled={!hasMatches}
        aria-label="Previous match"
        title="Previous match (Shift+Enter or ArrowUp)"
        onMouseDown={preserveInputFocus}
        onClick={onPrevious}
      />
      <Button
        minimal
        icon="arrow-down"
        disabled={!hasMatches}
        aria-label="Next match"
        title="Next match (Enter or ArrowDown)"
        onMouseDown={preserveInputFocus}
        onClick={onNext}
      />
      <Tooltip content={FOCUS_HINT}>
        <Button
          minimal
          disabled={!hasMatches}
          aria-label={FOCUS_HINT}
          title={FOCUS_HINT}
          onClick={onFocusCurrent}
        >
          <Icon icon="select" />
        </Button>
      </Tooltip>
      <Button
        minimal
        icon="cross"
        aria-label="Close find in page"
        title="Close (Esc)"
        onClick={onClose}
      />
    </Card>
  );
};
