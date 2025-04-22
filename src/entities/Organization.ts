import { Entity, Property, Unique } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class Organization extends BaseEntity {
  @Property()
  @Unique()
  name!: string;

  @Property({ nullable: true })
  logoUrl?: string;

  @Property()
  farmType!: 'vegetable' | 'dairy' | 'orchard' | 'mixed';
} 