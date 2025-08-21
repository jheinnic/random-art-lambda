This package demonstrates use of a dynamic module to implement both directions of generalized injection.

Producer-Specified Injection
-- Demonstrated by app.di.AppModule injecting an implementation of the BlockStore interface needed to satisfy a dependency of the RegionMapRepository
   that it wants the PlottingModule to have built by the IPLDModule without PlottingModule having to dictate what implementation to use.
-- Uses The AsyncConfigurable Interface which allows the AppModule to provide a useFactory method that is injected with tokens from its own 
   context.  Those tokens have to be resolvable before initialization Lifecycle completes, and the injected component must satisfy the requested
   interface
-- The PlottingModule need some implementation of an interface that allows it to read and write data blocks, but it doesn't care how that is implemented.

Consumer-Specified Injection
-- Demonstrated by plotting.di.PlottingModule when it uses the synchronous register() method to provide the configuration values for the Serdes objects it will need to configure Serialziation using the BlockStore injection it received from AppModule to yield a functional repository.  In this case, the configuration is used to specify what is needed and by which token it will be retrieved.
-- The IPLDModule can implement a Serialization strategy for any compliant model that it is presented a Schema for.  The PlottingModule needs to serialize its domain model to/from the blocks it will store and load with its injects BlockStore.   IPLD may have multiple consumers, each with its own model, so must be able to produce an arbitrary number of different ones, while ensuring each has its own injection token and is in the importable reach of its stakeholder.

Late Binding Runtime Injection
-- This will use a ModelRef injection augmented at runtime by a CustomContext ID set by the caller that initiates processing of a request that has identified the implementation it requires.
-- CLI Invocation will engage this use case since it must be able to inject its command line arguments into the PaintModule PaintService after NestJS has finished bootstrapping, and it cannot share the same runtime HTTP Request object used by the web service.  It also needs to change the mode of delivery, allowing completed images to be downloaded to a local drive rather than streamed back to the caller by HTTP
