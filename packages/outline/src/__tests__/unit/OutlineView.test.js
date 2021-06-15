/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {createRootNode, createTextNode} from 'outline';
import {createParagraphNode} from 'outline-extensions/ParagraphNode';
import {ViewModel} from '../../OutlineView';
import {markNodeAsDirty} from '../../OutlineNode';
import {initializeUnitTest} from '../utils';

describe('OutlineViewModel tests', () => {
  initializeUnitTest((testEnv) => {
    test('constructor', async () => {
      const root = createRootNode();
      const nodeMap = {root};
      const viewModel = new ViewModel(nodeMap);
      expect(viewModel._nodeMap).toBe(nodeMap);
      expect(viewModel._selection).toBe(null);
      expect(viewModel._dirtyNodes).toBeInstanceOf(Set);
      expect(viewModel._dirtyNodes.size).toBe(0);
      expect(viewModel._dirtySubTrees).toBeInstanceOf(Set);
      expect(viewModel._dirtySubTrees.size).toBe(0);
      expect(viewModel._isDirty).toBe(false);
    });

    test('hasDirtyNodes()', () => {
      const root = createRootNode();
      const nodeMap = {root};
      const viewModel = new ViewModel(nodeMap);
      expect(viewModel.hasDirtyNodes()).toEqual(viewModel._dirtyNodes.size > 0);
    });

    test('isDirty()', () => {
      const root = createRootNode();
      const nodeMap = {root};
      const viewModel = new ViewModel(nodeMap);
      expect(viewModel.isDirty()).toEqual(viewModel._isDirty);
    });

    test('markDirty()', () => {
      const root = createRootNode();
      const nodeMap = {root};
      const viewModel = new ViewModel(nodeMap);
      viewModel.markDirty();
      expect(viewModel.isDirty()).toEqual(true);
    });

    test('getDirtyNodes()', async () => {
      const {editor} = testEnv;
      expect(editor.getViewModel().getDirtyNodes()).toEqual([]);
      await editor.update((view) => {
        const textNode = createTextNode('foo');
        markNodeAsDirty(textNode);
        view.getRoot().append(textNode);
      });
      expect(editor.getViewModel().getDirtyNodes()).toEqual([
        {
          __flags: 0,
          __key: '_1',
          __parent: 'root',
          __text: 'foo',
          __type: 'text',
          __url: null,
        },
        {
          __children: ['_1'],
          __flags: 0,
          __key: 'root',
          __parent: null,
          __type: 'root',
        },
      ]);
    });

    test('read()', async () => {
      const {editor} = testEnv;

      await editor.update((view) => {
        const paragraph = createParagraphNode();
        const text = createTextNode('foo');
        paragraph.append(text);
        view.getRoot().append(paragraph);
      });

      let root = null;
      let paragraph = null;
      let text = null;
      editor.getViewModel().read((view) => {
        root = view.getRoot();
        paragraph = root.getFirstChild();
        text = paragraph.getFirstChild();
      });

      expect(root).toEqual({
        __children: ['_1'],
        __flags: 0,
        __key: 'root',
        __parent: null,
        __type: 'root',
      });
      expect(paragraph).toEqual({
        __children: ['_2'],
        __flags: 0,
        __key: '_1',
        __parent: 'root',
        __type: 'paragraph',
      });
      expect(text).toEqual({
        __text: 'foo',
        __flags: 0,
        __key: '_2',
        __parent: '_1',
        __type: 'text',
        __url: null,
      });
    });

    test('stringify()', async () => {
      const {editor} = testEnv;
      await editor.update((view) => {
        const paragraph = createParagraphNode();
        const text = createTextNode('Hello world');
        text.select(6, 11);
        paragraph.append(text);
        view.getRoot().append(paragraph);
      });
      expect(editor.getViewModel().stringify()).toEqual(
        `{"_nodeMap":{"root":{"__type":"root","__flags":0,"__key":"root","__parent":null,"__children":["_1"]},"_1":{"__type":"paragraph","__flags":0,"__key":"_1","__parent":"root","__children":["_2"]},"_2":{"__type":"text","__flags":0,"__key":"_2","__parent":"_1","__text":"Hello world","__url":null}},"_selection":{"anchorKey":"_2","anchorOffset":6,"focusKey":"_2","focusOffset":11}}`,
      );
      expect(editor.getViewModel().stringify(2)).toEqual(
        `{
  "_nodeMap": {
    "root": {
      "__type": "root",
      "__flags": 0,
      "__key": "root",
      "__parent": null,
      "__children": [
        "_1"
      ]
    },
    "_1": {
      "__type": "paragraph",
      "__flags": 0,
      "__key": "_1",
      "__parent": "root",
      "__children": [
        "_2"
      ]
    },
    "_2": {
      "__type": "text",
      "__flags": 0,
      "__key": "_2",
      "__parent": "_1",
      "__text": "Hello world",
      "__url": null
    }
  },
  "_selection": {
    "anchorKey": "_2",
    "anchorOffset": 6,
    "focusKey": "_2",
    "focusOffset": 11
  }
}`,
      );
    });

    test('ensure garbage collection works as expected', async () => {
      const {editor} = testEnv;
      await editor.update((view) => {
        const paragraph = createParagraphNode();
        const text = createTextNode('foo');
        paragraph.append(text);
        view.getRoot().append(paragraph);
      });

      // Remove the first node, which should cause a GC for everything
      await editor.update((view) => {
        view.getRoot().getFirstChild().remove();
      });

      expect(editor.getViewModel()._nodeMap).toEqual({
        root: {
          __children: [],
          __flags: 0,
          __key: 'root',
          __parent: null,
          __type: 'root',
        },
      });
    });
  });
});