export class OrderUtils {
  static formatTagOptions(value: string, allTags: string[]): string[] {
    if (!value) return allTags;

    const filterRegex = new RegExp(
      OrderUtils.escapeSpecialRegExCharacters(value),
      "i"
    );
    return allTags.filter((tag) => tag.match(filterRegex));
  }

  static escapeSpecialRegExCharacters(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  static getUniqueSortedTags(tags: string[]): string[] {
    return [...new Set(tags)].sort();
  }

  static splitTagString(tags: string): string[] {
    return tags ? tags.split(", ") : [];
  }

  static joinTags(tags: string[]): string {
    return tags.join(", ");
  }
}
