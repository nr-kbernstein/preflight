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
});
