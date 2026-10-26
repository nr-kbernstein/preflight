import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CommandPalette } from './CommandPalette';

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <CommandPalette open={false} onClose={() => {}} onNavigate={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('filters pages by query and navigates to the highlighted one on Enter', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} onNavigate={onNavigate} />);
    const input = screen.getByRole('textbox', { name: 'Search pages' });
    fireEvent.change(input, { target: { value: 'hist' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onNavigate).toHaveBeenCalledWith('/history');
    expect(onClose).toHaveBeenCalled();
  });

  it('moves the selection with arrow keys', () => {
    const onNavigate = vi.fn();
    render(<CommandPalette open onClose={() => {}} onNavigate={onNavigate} />);
    const input = screen.getByRole('textbox', { name: 'Search pages' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onNavigate).toHaveBeenCalledWith('/sessions');
  });

  it('shows an empty message when nothing matches', () => {
    render(<CommandPalette open onClose={() => {}} onNavigate={() => {}} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search pages' }), {
      target: { value: 'zzz' },
    });
    expect(screen.getByText('No matching pages')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} onNavigate={() => {}} />);
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Search pages' }), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape from anywhere inside the dialog', () => {
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} onNavigate={() => {}} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('traps Tab inside the dialog', () => {
    render(<CommandPalette open onClose={() => {}} onNavigate={() => {}} />);
    const input = screen.getByRole('textbox', { name: 'Search pages' });
    expect(input).toHaveFocus();
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false);
    expect(fireEvent.keyDown(input, { key: 'Tab', shiftKey: true })).toBe(false);
    expect(input).toHaveFocus();
  });

  it('restores focus to the previously focused element on close', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { rerender } = render(<CommandPalette open onClose={() => {}} onNavigate={() => {}} />);
    expect(screen.getByRole('textbox', { name: 'Search pages' })).toHaveFocus();
    rerender(<CommandPalette open={false} onClose={() => {}} onNavigate={() => {}} />);
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it('wires aria-controls and aria-activedescendant to the listbox options', () => {
    render(<CommandPalette open onClose={() => {}} onNavigate={() => {}} />);
    const input = screen.getByRole('textbox', { name: 'Search pages' });
    const listbox = screen.getByRole('listbox');
    expect(input).toHaveAttribute('aria-controls', listbox.id);
    const options = screen.getAllByRole('option');
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', options[1]!.id);
    expect(new Set(options.map((o) => o.id)).size).toBe(options.length);
  });
});
