build-NodeCanvasLayer:
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	mkdir -p "$(ARTIFACTS_DIR)/lib"
	./install-libs.sh "${ARTIFACTS_DIR}"
	cp -r test "$(ARTIFACTS_DIR)/nodejs"
	./build-layer.sh "${ARTIFACTS_DIR}"
	rm -rf "${ARTIFACTS_DIR}/nodejs/test"
