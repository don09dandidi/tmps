import type { AlertNotifier } from "../patterns/decorator/alert-notifier.ts";

export type DecoratorOptions = Readonly<Record<string, number>>;

/** One layer of the notification chain, e.g. { kind: "cooldown", options: { seconds: 120 } }. */
export interface DecoratorSpec {
  readonly kind: string;
  readonly options?: DecoratorOptions;
}

export type DecoratorCreator = (inner: AlertNotifier, options: DecoratorOptions) => AlertNotifier;

/**
 * Factory (creational): builds the decorated notifier chain from a policy
 * (a list of layers, outermost first), so the client never names a concrete
 * decorator. A new kind of decorator is a new class plus one register() call
 * in the composition root; this factory does not change.
 */
export class NotifierFactory {
  private readonly creators = new Map<string, DecoratorCreator>();

  register(kind: string, creator: DecoratorCreator): this {
    this.creators.set(kind, creator);
    return this;
  }

  kinds(): string[] {
    return [...this.creators.keys()];
  }

  create(channel: AlertNotifier, layers: readonly DecoratorSpec[]): AlertNotifier {
    // Wrap from the innermost layer outwards: [a, b] -> a(b(channel)).
    return layers.reduceRight<AlertNotifier>((inner, layer) => {
      const creator = this.creators.get(layer.kind);
      if (!creator) throw new Error(`unknown notifier layer '${layer.kind}' (known: ${this.kinds().join(", ")})`);
      return creator(inner, layer.options ?? {});
    }, channel);
  }
}
