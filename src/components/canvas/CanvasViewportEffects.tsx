'use client';

import { useEffect } from 'react';

import { useCanvasStore } from '@/stores/useCanvasStore';
import { toolbarGroups, useCanvasTool } from '@/stores/useCanvasTool';

export default function CanvasViewportEffects() {
  const { undo, redo } = useCanvasStore();
  const { activateTool, requestSave, setPortraitViewport, zoomIn, zoomOut } = useCanvasTool();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: portrait)');

    function syncViewport(event?: MediaQueryListEvent) {
      setPortraitViewport(event?.matches ?? mediaQuery.matches);
    }

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);

    return () => {
      mediaQuery.removeEventListener('change', syncViewport);
    };
  }, [setPortraitViewport]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return;
      }

      const eventKey = event.key.toLowerCase();
      const button = toolbarGroups
        .flatMap((group) => group.buttons)
        .find((candidate) => {
          if (!candidate.shortcut) {
            return false;
          }

          const shortcutKey = candidate.shortcut.key.toLowerCase();
          const isKeyMatch = eventKey === shortcutKey || (shortcutKey === '=' && eventKey === '+');

          return (
            isKeyMatch &&
            event.ctrlKey === Boolean(candidate.shortcut.ctrlKey) &&
            event.shiftKey === Boolean(candidate.shortcut.shiftKey) &&
            event.altKey === Boolean(candidate.shortcut.altKey) &&
            event.metaKey === Boolean(candidate.shortcut.metaKey)
          );
        });

      if (!button) {
        return;
      }

      event.preventDefault();

      if (button.action === 'activate') {
        activateTool(button);
        return;
      }

      if (button.action === 'save') {
        requestSave();
        return;
      }

      if (button.action === 'undo') {
        undo();
        return;
      }

      if (button.action === 'redo') {
        redo();
        return;
      }

      if (button.action === 'zoom-in') {
        zoomIn();
        return;
      }

      zoomOut();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activateTool, redo, requestSave, undo, zoomIn, zoomOut]);

  return null;
}
