'use babel';

import MrtAtom from '../lib/mrt-atom';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('MrtAtom', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('mrt-atom');
  });

  describe('when the mrt-atom:toggle event is triggered', () => {
    it('hides and shows the modal panel', () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      expect(workspaceElement.querySelector('.mrt-atom')).not.toExist();

      // This is an activation event, triggering it will cause the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'mrt-atom:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        expect(workspaceElement.querySelector('.mrt-atom')).toExist();

        let mrtAtomElement = workspaceElement.querySelector('.mrt-atom');
        expect(mrtAtomElement).toExist();

        let mrtAtomPanel = atom.workspace.panelForItem(mrtAtomElement);
        expect(mrtAtomPanel.isVisible()).toBe(true);
        atom.commands.dispatch(workspaceElement, 'mrt-atom:toggle');
        expect(mrtAtomPanel.isVisible()).toBe(false);
      });
    });

    it('hides and shows the view', () => {
      // This test shows you an integration test testing at the view level.

      // Attaching the workspaceElement to the DOM is required to allow the
      // `toBeVisible()` matchers to work. Anything testing visibility or focus
      // requires that the workspaceElement is on the DOM. Tests that attach the
      // workspaceElement to the DOM are generally slower than those off DOM.
      jasmine.attachToDOM(workspaceElement);

      expect(workspaceElement.querySelector('.mrt-atom')).not.toExist();

      // This is an activation event, triggering it causes the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'mrt-atom:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        // Now we can test for view visibility
        let mrtAtomElement = workspaceElement.querySelector('.mrt-atom');
        expect(mrtAtomElement).toBeVisible();
        atom.commands.dispatch(workspaceElement, 'mrt-atom:toggle');
        expect(mrtAtomElement).not.toBeVisible();
      });
    });
  });
});
