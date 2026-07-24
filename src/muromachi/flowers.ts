// 室町でも草花摘みはしない（学びは名所と栞にある）。図譜は空。
import type { FlowerSpec } from '../engine/textures'

export const FLOWERS: FlowerSpec[] = []

export interface FlowerSpot { id: string; species: string; x: number; z: number }
export const FLOWER_SPOTS: FlowerSpot[] = []

const FALLBACK: FlowerSpec = { id: 'none', kana: '', petal: '#ccc', accent: '#999', stem: '#5a7f5f', form: 'kiku' }
export const flowerById = (id: string): FlowerSpec => FLOWERS.find(f => f.id === id) ?? FALLBACK
