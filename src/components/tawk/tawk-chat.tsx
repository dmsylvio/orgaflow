"use client";

import TawkMessengerReact from "@tawk.to/tawk-messenger-react";

export function TawkChat() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

  if (!propertyId || !widgetId) {
    return null;
  }

  const noop = () => {};

  return (
    <TawkMessengerReact
      propertyId={propertyId}
      widgetId={widgetId}
      onLoad={noop}
      onStatusChange={noop}
      onBeforeLoad={noop}
      onChatMaximized={noop}
      onChatMinimized={noop}
      onChatHidden={noop}
      onChatStarted={noop}
      onChatEnded={noop}
      onPrechatSubmit={noop}
      onOfflineSubmit={noop}
      onChatMessageVisitor={noop}
      onChatMessageAgent={noop}
      onChatMessageSystem={noop}
      onAgentJoinChat={noop}
      onAgentLeaveChat={noop}
      onChatSatisfaction={noop}
      onVisitorNameChanged={noop}
      onFileUpload={noop}
      onTagsUpdated={noop}
      onUnreadCountChanged={noop}
    />
  );
}
