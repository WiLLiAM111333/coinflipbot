type Optional<T extends {}> = { [key in keyof T]?: T[key] };
