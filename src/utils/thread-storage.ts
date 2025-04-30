// src/utils/thread-storage.ts
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, 'threads.json');

type ThreadMap = Record<string, string>;

function readThreads(): ThreadMap {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function writeThreads(threads: ThreadMap) {
  fs.writeFileSync(filePath, JSON.stringify(threads, null, 2));
}

export function getThreadForUser(userId: string): string | undefined {
  const threads = readThreads();
  return threads[userId];
}

export function saveThreadForUser(userId: string, threadId: string) {
  const threads = readThreads();
  threads[userId] = threadId;
  writeThreads(threads);
}
export function deleteThreadForUser(userId: string) {
  const threads = readThreads();
  delete threads[userId];
  writeThreads(threads);
}
