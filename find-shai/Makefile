sandbox-create:
	npx ampx sandbox

sandbox-delete:
	npx ampx sandbox delete

pipeline-deploy:
	npx ampx pipeline-deploy

info:
	npx ampx info

generate-swift-graphql:
	npx ampx generate graphql-client-code --format modelgen --model-target swift --out find-shai-ios/AmplifyModels

get-user-endpoints:
	aws pinpoint get-user-endpoints --application-id "1572ba2cd8d8412b91e3e2c9ce15b0ce" --user-id "b2050464-3031-701f-de30-d61846e2dd92"

get-apps:
	aws pinpoint get-apps

send-message:
	aws pinpoint send-messages --application-id 1572ba2cd8d8412b91e3e2c9ce15b0ce --message-request '{"Addresses":{"0b0fc99d6ec313692ac487e461184bdeb6bf120688192dcba31195c469348d2b":{"ChannelType":"APNS"}},"MessageConfiguration":{"APNSMessage":{"RawContent":"{\"aps\" : {\"alert\" : {\"title\" : \"Game Request\",\"subtitle\" : \"Five Card Draw\",\"body\" : \"Bob wants to play poker\"},\"category\" : \"GAME_INVITATION\"},\"gameID\" : \"12345678\"}"}}}'

build-mobile-app:
	cd find-shai-mobile-app run start

run-mobile-app:
	cd find-shai-mobile-app
	# npm run start