import assert from 'node:assert/strict';
import test from 'node:test';
import { quickToggleWatchlistItem } from '../src/lib/watchlistActions.js';
import { watchlistEntryKey } from '../src/lib/watchlistModel.js';

test('quickToggleWatchlistItem adds an unsaved title and removes an already-saved title', () => {
  const fury = {
    tmdbId: 228150,
    mediaType: 'movie',
    title: 'Fury',
    year: '2014',
    rating: '7.6',
  };

  // 1. Add to empty watchlist
  const resAdd = quickToggleWatchlistItem([], fury);
  assert.equal(resAdd.action, 'added');
  assert.equal(resAdd.watchlist.length, 1);
  assert.equal(watchlistEntryKey(resAdd.watchlist[0]), 'movie:228150');
  assert.equal(resAdd.watchlist[0].status, 'saved');

  // 2. Toggle again -> removes from watchlist
  const resRemove = quickToggleWatchlistItem(resAdd.watchlist, fury);
  assert.equal(resRemove.action, 'removed');
  assert.equal(resRemove.watchlist.length, 0);
});

test('quickToggleWatchlistItem normalizes TV items that pass name or id instead of title/tmdbId', () => {
  const tvItem = {
    id: 95396,
    mediaType: 'tv',
    name: 'Severance',
    releaseYear: '2022',
  };

  const res = quickToggleWatchlistItem([], tvItem);
  assert.equal(res.action, 'added');
  assert.equal(res.watchlist.length, 1);
  assert.equal(res.watchlist[0].title, 'Severance');
  assert.equal(res.watchlist[0].tmdbId, 95396);
  assert.equal(res.watchlist[0].mediaType, 'tv');
});
