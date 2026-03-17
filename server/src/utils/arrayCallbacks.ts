export function map<T, U>(items: T[], changeItem: (item: T) => U): U[] {
  const transformedItems = new Array<U>(items.length);

  for (let index = 0; index < items.length; index += 1) {
    transformedItems[index] = changeItem(items[index]);
  }

  return transformedItems;
}

export function filter<T>(items: T[], predicate: (item: T) => boolean): T[] {
  const filteredItems: T[] = [];
  let outputIndex = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    if (predicate(item)) {
      filteredItems[outputIndex] = item;
      outputIndex += 1;
    }
  }

  return filteredItems;
}
