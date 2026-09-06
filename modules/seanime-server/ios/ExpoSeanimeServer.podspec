Pod::Spec.new do |s|
  s.name           = 'ExpoSeanimeServer'
  s.version        = '0.1.0'
  s.summary        = 'Expo module for hosting the Seanime Go server'
  s.description    = 'Expo module that starts the Seanime Gomobile server framework and manages mobile keep-alive behavior'
  s.author         = 'seanime'
  s.homepage       = 'https://github.com/5rahim/seanime'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.libraries = 'resolv'

  s.vendored_frameworks = '../../../ios/SeanimeCore.xcframework'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'FRAMEWORK_SEARCH_PATHS[sdk=iphoneos*]' => '$(inherited) "$(PODS_TARGET_SRCROOT)/../../../ios/SeanimeCore.xcframework/ios-arm64"',
    'FRAMEWORK_SEARCH_PATHS[sdk=iphonesimulator*]' => '$(inherited) "$(PODS_TARGET_SRCROOT)/../../../ios/SeanimeCore.xcframework/ios-arm64_x86_64-simulator"',
    'HEADER_SEARCH_PATHS[sdk=iphoneos*]' => '$(inherited) "$(PODS_TARGET_SRCROOT)/../../../ios/SeanimeCore.xcframework/ios-arm64/SeanimeCore.framework/Headers"',
    'HEADER_SEARCH_PATHS[sdk=iphonesimulator*]' => '$(inherited) "$(PODS_TARGET_SRCROOT)/../../../ios/SeanimeCore.xcframework/ios-arm64_x86_64-simulator/SeanimeCore.framework/Headers"',
    'OTHER_LDFLAGS' => '$(inherited) -framework SeanimeCore -lresolv',
    'VALID_ARCHS' => 'arm64 x86_64',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386'
  }

  s.user_target_xcconfig = {
    'FRAMEWORK_SEARCH_PATHS[sdk=iphoneos*]' => '$(inherited) "$(PODS_ROOT)/../SeanimeCore.xcframework/ios-arm64"',
    'FRAMEWORK_SEARCH_PATHS[sdk=iphonesimulator*]' => '$(inherited) "$(PODS_ROOT)/../SeanimeCore.xcframework/ios-arm64_x86_64-simulator"',
    'HEADER_SEARCH_PATHS[sdk=iphoneos*]' => '$(inherited) "$(PODS_ROOT)/../SeanimeCore.xcframework/ios-arm64/SeanimeCore.framework/Headers"',
    'HEADER_SEARCH_PATHS[sdk=iphonesimulator*]' => '$(inherited) "$(PODS_ROOT)/../SeanimeCore.xcframework/ios-arm64_x86_64-simulator/SeanimeCore.framework/Headers"',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386'
  }

  s.source_files = "*.{h,m,mm,swift,hpp,cpp}"
end
