import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { chooseAzoReply, getAzoConversation } from '../data/azoConversation.ts';
import { breakpoints, contentColumn } from '../../../theme/breakpoints.ts';
import { spacing } from '../../../theme/spacing.ts';

const source = ts.transpileModule(
  readFileSync(new URL('./AzoChatScreen.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;
const cream = [{ points: 'empty-room-shell' }];

function render({ answers = [], visibleCount, width = 375 }) {
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return { useRef: (current) => ({ current }) };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native') return {
        View: 'View', ScrollView: 'ScrollView', Pressable: 'Pressable',
        useWindowDimensions: () => ({ width }),
        StyleSheet: { create: (styles) => styles, hairlineWidth: 1 },
      };
      if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
      if (name === '../../common/Text') return { Text: 'Text' };
      if (name === '../../../hooks/useWhileVisible') return { useWhileVisible: () => {} };
      if (name === '../../../theme/breakpoints') return { breakpoints, contentColumn };
      if (name === '../../../theme/spacing') return { spacing };
      if (name === '../../../theme/typography') return { fonts: {}, scaleType: (value) => value };
      if (name === '../AzoChatChrome') return { AzoChatAvatar: 'Avatar', AzoChatBackButton: 'BackButton', azoChatColors: {} };
      if (name === '../data/azoConversation') return { chooseAzoReply, getAzoConversation };
      if (name === '../AzoBubbleText') return { default: 'AzoBubbleText' };
      if (name === '../AzoChatMessage') return { default: 'AzoChatMessage' };
      if (name === '../AzoTypingDots') return { default: 'AzoTypingDots' };
      if (name === '../useAzoChatDelivery') return {
        useAzoChatDelivery: (conversation) => ({
          messages: conversation.messages.slice(0, visibleCount),
          ready: visibleCount >= conversation.messages.length,
          animateFrom: 0, active: true, reducedMotion: false,
          finish() {}, cancel() {},
        }),
      };
      if (name === '../../../features/room/RoomScene') return { HexRoom: 'HexRoom' };
      if (name === '../../../features/room/roomShells') return { ROOM_SHELLS: { cream } };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports.default({ answers, onAnswersChange() {}, onContinue() {}, onBack() {} });
}

function nodes(tree) {
  if (tree == null || typeof tree !== 'object') return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}

test('the empty room arrives with moving-1 and appears once in its existing delivered bubble', () => {
  const before = render({ visibleCount: 1 });
  assert.equal(nodes(before).filter((node) => node.type === 'HexRoom').length, 0);
  for (const input of [
    { visibleCount: 2 },
    { answers: ['help', 'recognize', 'start', 'show', 'makePlan'], visibleCount: 100 },
  ]) {
    const tree = render(input);
    const rooms = nodes(tree).filter((node) => node.type === 'HexRoom');
    assert.equal(rooms.length, 1);
    const message = nodes(tree).find((node) => node.type === 'AzoChatMessage' && node.key === 'moving-1');
    assert.ok(message, 'the image remains inside the existing message entrance owner');
    const [text, image] = message.props.children.props.children;
    assert.equal(text.type, 'AzoBubbleText');
    assert.equal(text.props.text, getAzoConversation([]).messages[1].text);
    assert.equal(image.props.accessible, true);
    assert.equal(image.props.accessibilityRole, 'image');
    assert.equal(image.props.accessibilityLabel, 'Azo’s empty room, with bare walls and no furniture.');
    assert.equal(image.props.children, rooms[0]);
    assert.deepEqual(Object.keys(rooms[0].props.picks), []);
    assert.equal(rooms[0].props.shell, cream);
  }
});

test('the room shares the available text width on narrow phones and capped tablet layouts', () => {
  const widths = [];
  for (const width of [320, 375, 768, 1024]) {
    const tree = render({ visibleCount: 2, width });
    const message = nodes(tree).find((node) => node.key === 'moving-1');
    const [text, image] = message.props.children.props.children;
    const roomWidth = image.props.children.props.width;
    assert.equal(roomWidth, text.props.maxWidth);
    assert.ok(roomWidth > 0 && roomWidth < Math.min(width, breakpoints.contentMaxWidth));
    widths.push(roomWidth);
  }
  assert.ok(widths[1] > widths[0], 'the room follows phone resizing');
  assert.equal(widths[2], widths[3], 'the existing reading column caps wide layouts');
});
