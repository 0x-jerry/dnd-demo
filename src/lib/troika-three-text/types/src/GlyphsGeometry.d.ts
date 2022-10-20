export const GlyphsGeometry: {
    new (): {
        detail: any;
        curveRadius: any;
        groups: {
            start: number;
            count: number;
            materialIndex: number;
        }[];
        boundingSphere: any;
        boundingBox: any;
        computeBoundingSphere(): void;
        computeBoundingBox(): void;
        setSide(side: any): void;
        _detail: any;
        _curveRadius: any;
        /**
         * Update the geometry for a new set of glyphs.
         * @param {Float32Array} glyphBounds - An array holding the planar bounds for all glyphs
         *        to be rendered, 4 entries for each glyph: x1,x2,y1,y1
         * @param {Float32Array} glyphAtlasIndices - An array holding the index of each glyph within
         *        the SDF atlas texture.
         * @param {Array} blockBounds - An array holding the [minX, minY, maxX, maxY] across all glyphs
         * @param {Array} [chunkedBounds] - An array of objects describing bounds for each chunk of N
         *        consecutive glyphs: `{start:N, end:N, rect:[minX, minY, maxX, maxY]}`. This can be
         *        used with `applyClipRect` to choose an optimized `instanceCount`.
         * @param {Uint8Array} [glyphColors] - An array holding r,g,b values for each glyph.
         */
        updateGlyphs(glyphBounds: Float32Array, glyphAtlasIndices: Float32Array, blockBounds: any[], chunkedBounds?: any[], glyphColors?: Uint8Array): void;
        _blockBounds: any[];
        _chunkedBounds: any[];
        _updateBounds(): void;
        /**
         * Given a clipping rect, and the chunkedBounds from the last updateGlyphs call, choose the lowest
         * `instanceCount` that will show all glyphs within the clipped view. This is an optimization
         * for long blocks of text that are clipped, to skip vertex shader evaluation for glyphs that would
         * be clipped anyway.
         *
         * Note that since `drawElementsInstanced[ANGLE]` only accepts an instance count and not a starting
         * offset, this optimization becomes less effective as the clipRect moves closer to the end of the
         * text block. We could fix that by switching from instancing to a full geometry with a drawRange,
         * but at the expense of much larger attribute buffers (see classdoc above.)
         *
         * @param {Vector4} clipRect
         */
        applyClipRect(clipRect: Vector4): void;
        setAttribute(name: any, attribute: any): any;
    };
};
