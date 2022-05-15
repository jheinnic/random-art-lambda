build-CanvasLayer:
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	cp -r test "$(ARTIFACTS_DIR)/nodejs"
	cp -r build-layer.sh lib "$(ARTIFACTS_DIR)"
	./build-layer.sh "${ARTIFACTS_DIR}"
	rm "${ARTIFACTS_DIR}/build-layer.sh"
	rm -rf "${ARTIFACTS_DIR}/nodejs/test"
