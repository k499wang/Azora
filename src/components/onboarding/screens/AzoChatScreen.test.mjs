import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { AZO_CONVERSATION, chooseAzoReply, getAzoConversation } from '../data/azoConversation.ts';
import { breakpoints, contentColumn } from '../../../theme/breakpoints.ts';
import { spacing } from '../../../theme/spacing.ts';

const source = ts.transpileModule(
  readFileSync(new URL('./AzoChatScreen.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;
const cream = [{ points: 'empty-room-shell' }];
const NAME = 'Sam';
const intro = ['named', 'tell'];
const roomIndex = getAzoConversation(intro, undefined, NAME).messages.findIndex(({ id }) => id === 'moving-0');

function render({ answers = [], visibleCount, width = 375, onAnswersChange = () => {} }) {
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return { useRef: (current) => ({ current }), useState: (value) => [value, () => {}], useEffect: () => {} };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native') return {
        View: 'View', ScrollView: 'ScrollView', Pressable: 'Pressable', KeyboardAvoidingView: 'KeyboardAvoidingView',
        Platform: { OS: 'ios' }, Keyboard: { addListener: () => ({ remove() {} }) },
        useWindowDimensions: () => ({ width }),
        StyleSheet: { create: (styles) => styles, hairlineWidth: 1 },
      };
      if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
      if (name === '../../common/Text') return { Text: 'Text', TextInput: 'TextInput' };
      if (name === '../../common/icons/Icon') return { default: 'Icon' };
      if (name === '../../../theme/colors') return { colors: { text: {}, neutral: {} } };
      if (name === '../../../hooks/useWhileVisible') return { useWhileVisible: () => {} };
      if (name === '../../../theme/breakpoints') return { breakpoints, contentColumn };
      if (name === '../../../theme/spacing') return { spacing };
      if (name === '../../../theme/typography') return { fonts: {}, scaleType: (value) => value };
      if (name === '../AzoChatChrome') return { AzoChatHeader: 'Header', azoChatColors: {} };
      if (name === '../data/azoConversation') return { AZO_CONVERSATION, chooseAzoReply, getAzoConversation };
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
  return exports.default({ answers, name: NAME, onNameChange() {}, onAnswersChange, onContinue() {}, onBack() {} });
}

function nodes(tree) {
  if (tree == null || typeof tree !== 'object') return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}

test('the empty room arrives with moving-0 and appears once in its existing delivered bubble', () => {
  const before = render({ answers: intro, visibleCount: roomIndex });
  assert.equal(nodes(before).filter((node) => node.type === 'HexRoom').length, 0);
  for (const input of [
    { answers: intro, visibleCount: roomIndex + 1 },
    { answers: [...intro, 'help', 'recognize', 'start', 'tasksHelp', 'next', 'show', 'makePlan'], visibleCount: 100 },
  ]) {
    const tree = render(input);
    const rooms = nodes(tree).filter((node) => node.type === 'HexRoom');
    assert.equal(rooms.length, 1);
    const message = nodes(tree).find((node) => node.type === 'AzoChatMessage' && node.key === 'moving-0');
    assert.ok(message, 'the image remains inside the existing message entrance owner');
    const [text, image] = message.props.children.props.children;
    assert.equal(text.type, 'AzoBubbleText');
    assert.equal(text.props.text, getAzoConversation(intro, undefined, NAME).messages[roomIndex].text);
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
    const tree = render({ answers: intro, visibleCount: roomIndex + 1, width });
    const message = nodes(tree).find((node) => node.key === 'moving-0');
    const [text, image] = message.props.children.props.children;
    const roomWidth = image.props.children.props.width;
    assert.equal(roomWidth, text.props.maxWidth);
    assert.ok(roomWidth > 0 && roomWidth < Math.min(width, breakpoints.contentMaxWidth));
    widths.push(roomWidth);
  }
  assert.ok(widths[1] > widths[0], 'the room follows phone resizing');
  assert.equal(widths[2], widths[3], 'the existing reading column caps wide layouts');
});

test('restoring and going Back scroll to the reached turn around the intermediate choice', () => {
  const completed = [...intro, 'help', 'recognize', 'start', 'tasksHelp', 'next', 'show', 'makePlan'];
  for (const { answerCount, restoredAnchor, backAnchor } of [
    { answerCount: 6, restoredAnchor: 'tools-0', backAnchor: 'plan-0' },
    { answerCount: 7, restoredAnchor: 'dailyPlan-0', backAnchor: 'tools-0' },
    { answerCount: 8, restoredAnchor: 'room-0', backAnchor: 'dailyPlan-0' },
    { answerCount: 9, restoredAnchor: 'room-0', backAnchor: 'room-0' },
    { answerCount: 1, restoredAnchor: 'greeting', backAnchor: 'name-0' },
  ]) {
    const answers = completed.slice(0, answerCount);
    const changes = [];
    const tree = render({ answers, visibleCount: 100, onAnswersChange: (next) => changes.push(next) });
    const scrollCalls = [];
    const scroll = nodes(tree).find((node) => node.type === 'ScrollView');
    scroll.props.ref.current = { scrollTo: (options) => scrollCalls.push(options) };
    const positions = new Map();
    const messages = nodes(tree).filter((node) => node.type === 'AzoChatMessage');
    for (const [index, message] of messages.entries()) {
      const y = (index + 1) * 100;
      positions.set(message.key, y);
      message.props.onLayout({ nativeEvent: { layout: { y } } });
    }
    assert.equal(scrollCalls.length, 1);
    assert.equal(scrollCalls[0].y, positions.get(restoredAnchor) - spacing.md);
    assert.equal(scrollCalls[0].animated, false);

    nodes(tree).find((node) => node.type === 'Header').props.onBack();
    assert.deepEqual(changes, [answers.slice(0, -1)]);
    assert.equal(scrollCalls.length, 2);
    assert.equal(scrollCalls[1].y, positions.get(backAnchor) - spacing.md);
  }
});
