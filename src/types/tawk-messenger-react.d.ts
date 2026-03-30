declare module "@tawk.to/tawk-messenger-react" {
  import type * as React from "react";

  export type TawkCustomStyle = Record<string, unknown>;

  export interface TawkMessengerReactProps {
    propertyId: string;
    widgetId: string;
    customStyle?: TawkCustomStyle | null;
    embedId?: string;
    basePath?: string;

    onLoad?: () => void;
    onStatusChange?: (status: unknown) => void;
    onBeforeLoad?: () => void;

    onChatMaximized?: () => void;
    onChatMinimized?: () => void;
    onChatHidden?: () => void;
    onChatStarted?: () => void;
    onChatEnded?: () => void;

    onPrechatSubmit?: (data: unknown) => void;
    onOfflineSubmit?: (data: unknown) => void;

    onChatMessageVisitor?: (message: unknown) => void;
    onChatMessageAgent?: (message: unknown) => void;
    onChatMessageSystem?: (message: unknown) => void;

    onAgentJoinChat?: (data: unknown) => void;
    onAgentLeaveChat?: (data: unknown) => void;

    onChatSatisfaction?: (satisfaction: unknown) => void;
    onVisitorNameChanged?: (visitorName: unknown) => void;
    onFileUpload?: (link: unknown) => void;
    onTagsUpdated?: (data: unknown) => void;
    onUnreadCountChanged?: (data: unknown) => void;
  }

  export interface TawkMessengerReactRef {
    maximize: () => unknown;
    minimize: () => unknown;
    toggle: () => unknown;
    popup: () => unknown;
    showWidget: () => unknown;
    hideWidget: () => unknown;
    toggleVisibility: () => unknown;
    endChat: () => unknown;

    getWindowType: () => unknown;
    getStatus: () => unknown;

    isChatMaximized: () => unknown;
    isChatMinimized: () => unknown;
    isChatHidden: () => unknown;
    isChatOngoing: () => unknown;
    isVisitorEngaged: () => unknown;

    onLoaded: () => unknown;
    onBeforeLoaded: () => unknown;
    widgetPosition: () => unknown;

    visitor: (data: unknown) => void;
    setAttributes: (
      attribute: unknown,
      callback?: (error?: unknown) => void,
    ) => void;
    addEvent: (
      event: unknown,
      metadata?: unknown,
      callback?: (error?: unknown) => void,
    ) => void;
    addTags: (tags: unknown, callback?: (error?: unknown) => void) => void;
    removeTags: (tags: unknown, callback?: (error?: unknown) => void) => void;
  }

  const TawkMessengerReact: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<TawkMessengerReactProps> &
      React.RefAttributes<TawkMessengerReactRef>
  >;

  export default TawkMessengerReact;
}
